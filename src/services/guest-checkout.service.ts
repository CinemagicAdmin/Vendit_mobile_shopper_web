import axios, { type AxiosResponse } from 'axios';
import { config } from '@/config/env';
import { toGuestApiError } from '@/utils/guest-api-error';
import type {
  CreateGuestCheckoutPayload,
  GuestAuth,
  GuestBasket,
  GuestCheckoutStart,
  GuestCheckoutStatus,
  GuestDispenseResponse,
  GuestEnvelope,
  GuestQuote,
} from '@/types/guest-checkout';
import type { GuestMenu } from '@/types/guest-menu';

// Deliberately not the shared client: guests have no token, and its 401 handler redirects to login.
const guestApi = axios.create({
  baseURL: config.apiUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

async function unwrap<T>(request: Promise<AxiosResponse<GuestEnvelope<T>>>): Promise<T> {
  try {
    const response = await request;
    return response.data.data;
  } catch (error: unknown) {
    throw toGuestApiError(error);
  }
}

// The backend takes one gateway proof at a time.
function proofParams(auth: GuestAuth): Record<string, string> {
  if (auth.tapId) return { tapId: auth.tapId };
  return auth.mfPaymentId ? { mfPaymentId: auth.mfPaymentId } : {};
}

function authOptions(auth: GuestAuth) {
  return {
    headers: auth.secret ? { Authorization: `Guest ${auth.secret}` } : {},
    params: proofParams(auth),
  };
}

function paymentPath(paymentId: string): string {
  return `/guest-checkouts/${encodeURIComponent(paymentId)}`;
}

export const guestCheckoutService = {
  getMenu: (machineId: string) =>
    unwrap<GuestMenu>(guestApi.get(`/guest-checkouts/machines/${encodeURIComponent(machineId)}`)),

  getQuote: (basket: GuestBasket) =>
    unwrap<GuestQuote>(
      guestApi.get('/guest-checkouts/quote', {
        params: {
          machineId: basket.machineId,
          productIds: basket.lines.map((line) => line.productId).join(','),
          quantities: basket.lines.map((line) => line.quantity).join(','),
        },
      }),
    ),

  create: (secret: string, payload: CreateGuestCheckoutPayload) =>
    unwrap<GuestCheckoutStart>(
      guestApi.post('/guest-checkouts', payload, {
        headers: { Authorization: `Guest ${secret}` },
      }),
    ),

  getStatus: (paymentId: string, auth: GuestAuth) =>
    unwrap<GuestCheckoutStatus>(guestApi.get(paymentPath(paymentId), authOptions(auth))),

  requestDispense: (paymentId: string, auth: GuestAuth) =>
    unwrap<GuestDispenseResponse>(
      guestApi.post(`${paymentPath(paymentId)}/dispense`, {}, authOptions(auth)),
    ),
};
