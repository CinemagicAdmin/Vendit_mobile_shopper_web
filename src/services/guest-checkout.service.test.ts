import { beforeEach, describe, expect, it, vi } from 'vitest';

const http = vi.hoisted(() => ({
  get: vi.fn(async () => ({ data: { data: { outcome: 'pending' } } })),
  post: vi.fn(async () => ({ data: { data: { result: 'dispatched' } } })),
}));

vi.mock('axios', () => ({ default: { create: () => http } }));

const { guestCheckoutService } = await import('@/services/guest-checkout.service');

const PAYMENT_ID = '6f1d3f7e-8b2a-4c1d-9e3f-0a1b2c3d4e5f';
const NO_AUTH = { secret: null, tapId: null, mfPaymentId: null };

const optionsOf = (mock: typeof http.get | typeof http.post, index: number) =>
  (mock.mock.calls[0] as unknown[])[index] as { headers: unknown; params: unknown };

beforeEach(() => vi.clearAllMocks());

describe('guest status and dispense proofs', () => {
  it("sends MyFatoorah's payment id as mfPaymentId", async () => {
    await guestCheckoutService.getStatus(PAYMENT_ID, { ...NO_AUTH, mfPaymentId: '0707' });
    expect(optionsOf(http.get, 1)).toEqual({ headers: {}, params: { mfPaymentId: '0707' } });
  });

  it('sends a Tap charge id as tapId, as before', async () => {
    await guestCheckoutService.requestDispense(PAYMENT_ID, { ...NO_AUTH, tapId: 'chg_TS02A1234567' });
    expect(optionsOf(http.post, 2)).toEqual({ headers: {}, params: { tapId: 'chg_TS02A1234567' } });
  });

  it('never sends both proofs, and keeps the secret in the header', async () => {
    await guestCheckoutService.getStatus(PAYMENT_ID, { secret: 'S', tapId: 'chg_TS02A1234567', mfPaymentId: '0707' });
    expect(optionsOf(http.get, 1)).toEqual({
      headers: { Authorization: 'Guest S' },
      params: { tapId: 'chg_TS02A1234567' },
    });
  });
});

describe('guest checkout link', () => {
  it('proves the payment with the guest secret and sends the visitor ids', async () => {
    const payload = { visitorId: 'V'.repeat(22), visitId: 'S'.repeat(22), paymentId: PAYMENT_ID };
    await guestCheckoutService.linkVisitor('S'.repeat(43), payload);
    expect(http.post).toHaveBeenCalledWith('/web-funnel/checkout-links', payload, {
      headers: { Authorization: `Guest ${'S'.repeat(43)}` },
    });
  });
});
