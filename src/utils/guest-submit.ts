import {
  conflictReason,
  readDetailNumber,
  toGuestApiError,
  type GuestApiError,
} from '@/utils/guest-api-error';
import type { CreateGuestCheckoutPayload, GuestCheckoutStart } from '@/types/guest-checkout';

export const MAX_IN_PROGRESS_RETRIES = 5;
const DEFAULT_RETRY_MS = 2000;
const MAX_RETRY_MS = 10000;

export interface GuestSubmitDeps {
  create: (secret: string, payload: CreateGuestCheckoutPayload) => Promise<GuestCheckoutStart>;
  loadSecret: () => string | null;
  saveSecret: (secret: string) => void;
  clearSecret: () => void;
  newSecret: () => string;
  sleep: (ms: number) => Promise<void>;
}

export interface GuestSubmitResult {
  secret: string;
  start: GuestCheckoutStart;
}

export function retryDelayMs(error: GuestApiError): number {
  const seconds = readDetailNumber(error, 'retryAfterSeconds');
  if (seconds === null || seconds <= 0) return DEFAULT_RETRY_MS;
  return Math.min(seconds * 1000, MAX_RETRY_MS);
}

// The secret survives only when the server may still hold, or be finishing, this exact attempt.
export function keepsSecret(error: GuestApiError): boolean {
  if (error.status === 0 || error.status === 429) return true;
  if (conflictReason(error) === 'IN_PROGRESS') return true;
  return error.status >= 500 && error.code !== 'MACHINE_OFFLINE' && error.code !== 'FEATURE_DISABLED';
}

function canRotate(error: GuestApiError): boolean {
  return (
    conflictReason(error) === 'DIFFERENT_REQUEST' ||
    (error.status === 401 && error.code === 'INVALID_TOKEN')
  );
}

export async function submitGuestCheckout(
  payload: CreateGuestCheckoutPayload,
  deps: GuestSubmitDeps,
): Promise<GuestSubmitResult> {
  const mint = () => {
    const fresh = deps.newSecret();
    deps.saveSecret(fresh);
    return fresh;
  };
  let secret = deps.loadSecret() ?? mint();
  let rotated = false;
  let inProgressRetries = 0;

  for (;;) {
    try {
      return { secret, start: await deps.create(secret, payload) };
    } catch (caught: unknown) {
      const error = toGuestApiError(caught);
      if (conflictReason(error) === 'IN_PROGRESS' && inProgressRetries < MAX_IN_PROGRESS_RETRIES) {
        inProgressRetries += 1;
        await deps.sleep(retryDelayMs(error));
        continue;
      }
      if (!rotated && canRotate(error)) {
        rotated = true;
        secret = mint();
        continue;
      }
      if (!keepsSecret(error)) deps.clearSecret();
      throw error;
    }
  }
}
