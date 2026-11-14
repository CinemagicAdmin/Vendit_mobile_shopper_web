import { describe, expect, it, vi } from 'vitest';
import { GuestApiError } from '@/utils/guest-api-error';
import {
  MAX_IN_PROGRESS_RETRIES,
  keepsSecret,
  retryDelayMs,
  submitGuestCheckout,
  type GuestSubmitDeps,
} from '@/utils/guest-submit';
import type { CreateGuestCheckoutPayload, GuestCheckoutStart } from '@/types/guest-checkout';

const payload: CreateGuestCheckoutPayload = {
  machineId: 'M',
  products: [{ productId: 'a', quantity: 1 }],
  amount: 0.25,
  paymentMethod: 'ALL',
};

const start: GuestCheckoutStart = {
  paymentId: '6f1d3f7e-8b2a-4c1d-9e3f-0a1b2c3d4e5f',
  orderReference: 'VND-1',
  outcome: 'pending',
  status: 'PENDING',
  amount: 0.25,
  currency: 'KWD',
  checkoutUrl: 'https://checkout.example/pay',
};

const apiError = (status: number, code: string | null, details: Record<string, unknown> | null = null) =>
  new GuestApiError({ status, code, message: 'x', details });

function makeDeps(stored: string | null, outcomes: Array<GuestCheckoutStart | GuestApiError>) {
  let counter = 0;
  const create = vi.fn(async () => {
    const next = outcomes.shift();
    if (!next) throw new Error('unexpected call');
    if (next instanceof GuestApiError) throw next;
    return next;
  });
  const deps: GuestSubmitDeps = {
    create,
    loadSecret: vi.fn(() => stored),
    saveSecret: vi.fn(),
    clearSecret: vi.fn(),
    newSecret: vi.fn(() => `secret-${++counter}`),
    sleep: vi.fn(async () => undefined),
  };
  return deps;
}

describe('submitGuestCheckout', () => {
  it('reuses a stored secret and does not mint a new one', async () => {
    const deps = makeDeps('stored', [start]);
    await expect(submitGuestCheckout(payload, deps)).resolves.toEqual({ secret: 'stored', start });
    expect(deps.newSecret).not.toHaveBeenCalled();
    expect(deps.create).toHaveBeenCalledWith('stored', payload);
  });

  it('persists a fresh secret before sending it', async () => {
    const deps = makeDeps(null, [start]);
    const order: string[] = [];
    vi.mocked(deps.saveSecret).mockImplementation(() => void order.push('save'));
    vi.mocked(deps.create).mockImplementation(async () => {
      order.push('create');
      return start;
    });
    await submitGuestCheckout(payload, deps);
    expect(order).toEqual(['save', 'create']);
    expect(deps.saveSecret).toHaveBeenCalledWith('secret-1');
  });

  it('retries IN_PROGRESS with the same secret after the advised delay', async () => {
    const busy = apiError(409, 'CONFLICT', { reason: 'IN_PROGRESS', retryAfterSeconds: 3 });
    const deps = makeDeps('stored', [busy, busy, start]);
    await expect(submitGuestCheckout(payload, deps)).resolves.toEqual({ secret: 'stored', start });
    expect(vi.mocked(deps.create).mock.calls.map(([secret]) => secret)).toEqual(['stored', 'stored', 'stored']);
    expect(deps.sleep).toHaveBeenCalledWith(3000);
  });

  it('gives up on IN_PROGRESS after the retry budget and keeps the secret', async () => {
    const busy = apiError(409, 'CONFLICT', { reason: 'IN_PROGRESS' });
    const deps = makeDeps('stored', Array.from({ length: MAX_IN_PROGRESS_RETRIES + 1 }, () => busy));
    await expect(submitGuestCheckout(payload, deps)).rejects.toBe(busy);
    expect(deps.create).toHaveBeenCalledTimes(MAX_IN_PROGRESS_RETRIES + 1);
    expect(deps.clearSecret).not.toHaveBeenCalled();
  });

  it('mints a new secret once on DIFFERENT_REQUEST', async () => {
    const different = apiError(409, 'CONFLICT', { reason: 'DIFFERENT_REQUEST' });
    const deps = makeDeps('stored', [different, start]);
    await expect(submitGuestCheckout(payload, deps)).resolves.toEqual({ secret: 'secret-1', start });
    expect(deps.saveSecret).toHaveBeenCalledWith('secret-1');
  });

  it('does not rotate twice and clears the secret after a second DIFFERENT_REQUEST', async () => {
    const different = apiError(409, 'CONFLICT', { reason: 'DIFFERENT_REQUEST' });
    const deps = makeDeps('stored', [different, different]);
    await expect(submitGuestCheckout(payload, deps)).rejects.toBe(different);
    expect(deps.newSecret).toHaveBeenCalledTimes(1);
    expect(deps.clearSecret).toHaveBeenCalledTimes(1);
  });

  it('rotates once when the stored secret is rejected as malformed', async () => {
    const deps = makeDeps('stored', [apiError(401, 'INVALID_TOKEN'), start]);
    await expect(submitGuestCheckout(payload, deps)).resolves.toEqual({ secret: 'secret-1', start });
  });

  it.each([
    [apiError(402, 'PAYMENT_FAILED'), true],
    [apiError(409, 'PRICE_MISMATCH', { expectedAmount: 0.3 }), true],
    [apiError(503, 'MACHINE_OFFLINE'), true],
    [apiError(0, 'NETWORK_ERROR'), false],
    [apiError(429, null), false],
    [apiError(503, 'SERVICE_UNAVAILABLE'), false],
  ])('clears the secret only after a definite failure (%s)', async (error, cleared) => {
    const deps = makeDeps('stored', [error]);
    await expect(submitGuestCheckout(payload, deps)).rejects.toBe(error);
    expect(vi.mocked(deps.clearSecret).mock.calls.length > 0).toBe(cleared);
  });
});

describe('retryDelayMs and keepsSecret', () => {
  it('uses retryAfterSeconds within bounds', () => {
    expect(retryDelayMs(apiError(409, 'CONFLICT', { retryAfterSeconds: 1 }))).toBe(1000);
    expect(retryDelayMs(apiError(409, 'CONFLICT', { retryAfterSeconds: 120 }))).toBe(10000);
    expect(retryDelayMs(apiError(409, 'CONFLICT'))).toBe(2000);
  });

  it('keeps the secret for in-progress conflicts', () => {
    expect(keepsSecret(apiError(409, 'CONFLICT', { reason: 'IN_PROGRESS' }))).toBe(true);
    expect(keepsSecret(apiError(409, 'CONFLICT', { reason: 'DIFFERENT_REQUEST' }))).toBe(false);
  });
});
