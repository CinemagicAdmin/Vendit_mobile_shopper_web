import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GuestCheckoutStatus } from '@/types/guest-checkout';

const service = vi.hoisted(() => ({ getStatus: vi.fn(), requestDispense: vi.fn() }));

vi.mock('@/services/guest-checkout.service', () => ({ guestCheckoutService: service }));

const { GuestOrderPoller } = await import('@/services/guest-order-poller');

const PAYMENT_ID = '6f1d3f7e-8b2a-4c1d-9e3f-0a1b2c3d4e5f';
const FAILED = { outcome: 'failed', dispense: null, pollIntervalMs: 3000 } as unknown as GuestCheckoutStatus;

beforeEach(() => {
  vi.clearAllMocks();
  service.getStatus.mockResolvedValue(FAILED);
});

describe('GuestOrderPoller proofs', () => {
  it("polls on MyFatoorah's payment id when the browser holds no secret", async () => {
    const emit = vi.fn();
    const poller = new GuestOrderPoller(PAYMENT_ID, { tapId: null, mfPaymentId: '0707' }, emit);
    poller.start();
    await vi.waitFor(() => expect(service.getStatus).toHaveBeenCalled());
    poller.stop();

    expect(service.getStatus).toHaveBeenCalledWith(PAYMENT_ID, { secret: null, tapId: null, mfPaymentId: '0707' });
    expect(emit).toHaveBeenCalledWith(expect.objectContaining({ notFound: false }));
  });

  it('reports not found without asking when there is no proof at all', () => {
    const emit = vi.fn();
    new GuestOrderPoller(PAYMENT_ID, { tapId: null, mfPaymentId: null }, emit).start();

    expect(emit).toHaveBeenCalledWith(expect.objectContaining({ notFound: true }));
    expect(service.getStatus).not.toHaveBeenCalled();
  });
});
