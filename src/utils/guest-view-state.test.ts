import { describe, expect, it } from 'vitest';
import {
  EMPTY_SNAPSHOT,
  parseReturnParams,
  safePayUrl,
  toGuestViewState,
  type GuestOrderSnapshot,
  type ReturnQuery,
} from '@/utils/guest-view-state';
import type { GuestCheckoutStatus, GuestDispense, GuestOutcome } from '@/types/guest-checkout';

function status(outcome: GuestOutcome, dispense: Partial<GuestDispense> | null = null): GuestCheckoutStatus {
  return {
    paymentId: '6f1d3f7e-8b2a-4c1d-9e3f-0a1b2c3d4e5f',
    orderReference: 'VND-1001',
    outcome,
    status: outcome.toUpperCase(),
    amount: 0.5,
    currency: 'KWD',
    checkoutUrl: null,
    machine: { name: 'Lobby' },
    dispense: dispense && {
      state: 'not_started',
      isComplete: false,
      authorizedUnits: 3,
      confirmedUnits: 0,
      failedUnits: 0,
      inFlightUnits: 0,
      ...dispense,
    },
    pollIntervalMs: 2000,
  };
}

const kindOf = (patch: Partial<GuestOrderSnapshot>) => toGuestViewState({ ...EMPTY_SNAPSHOT, ...patch }).kind;

describe('toGuestViewState', () => {
  it('waits for payment until a status arrives', () => {
    expect(kindOf({})).toBe('waiting_payment');
    expect(kindOf({ status: status('pending') })).toBe('waiting_payment');
  });

  it('reports not found before anything else', () => {
    expect(kindOf({ notFound: true, status: status('succeeded') })).toBe('not_found');
  });

  it('maps failed and review outcomes', () => {
    expect(kindOf({ status: status('failed') })).toBe('payment_failed');
    expect(kindOf({ status: status('review') })).toBe('review');
    expect(kindOf({ status: status('review'), timedOut: true })).toBe('review');
  });

  it('times out a payment that never settles', () => {
    expect(kindOf({ status: status('pending'), timedOut: true })).toBe('timeout');
    expect(kindOf({ timedOut: true })).toBe('timeout');
  });

  it('prepares, dispenses and completes a paid order', () => {
    expect(kindOf({ status: status('succeeded') })).toBe('preparing');
    expect(kindOf({ status: status('succeeded', { state: 'not_started' }) })).toBe('preparing');
    expect(kindOf({ status: status('succeeded', { state: 'dispensing' }) })).toBe('dispensing');
    expect(kindOf({ status: status('succeeded', { state: 'awaiting_next' }) })).toBe('dispensing');
    expect(kindOf({ status: status('succeeded', { state: 'completed', isComplete: true }) })).toBe(
      'completed',
    );
  });

  it('reports partial and failed dispenses once complete', () => {
    expect(kindOf({ status: status('succeeded', { state: 'partial', isComplete: true }) })).toBe('partial');
    expect(kindOf({ status: status('succeeded', { state: 'failed', isComplete: true }) })).toBe('partial');
  });

  it('surfaces machine_offline and no_coil dispense results until progress shows', () => {
    expect(kindOf({ status: status('succeeded'), dispenseResult: 'machine_offline' })).toBe('machine_offline');
    expect(kindOf({ status: status('succeeded'), dispenseResult: 'no_coil' })).toBe('partial');
    expect(
      kindOf({ status: status('succeeded', { state: 'dispensing' }), dispenseResult: 'machine_offline' }),
    ).toBe('dispensing');
  });

  it('times out a paid order that never finishes, but not a finished one', () => {
    expect(kindOf({ status: status('succeeded', { state: 'dispensing' }), timedOut: true })).toBe('timeout');
    expect(
      kindOf({ status: status('succeeded', { state: 'completed', isComplete: true }), timedOut: true }),
    ).toBe('completed');
  });

  it('carries units, the reference and a retry link only for failed payments', () => {
    const paid = toGuestViewState({
      ...EMPTY_SNAPSHOT,
      status: status('succeeded', { state: 'dispensing', confirmedUnits: 1 }),
      payUrl: '/pay?m=M&p=a&q=1',
    });
    expect(paid).toMatchObject({ confirmedUnits: 1, totalUnits: 3, reference: 'VND-1001', retryUrl: null });

    const failed = toGuestViewState({ ...EMPTY_SNAPSHOT, status: status('failed'), payUrl: '/pay?m=M&p=a&q=1' });
    expect(failed.retryUrl).toBe('/pay?m=M&p=a&q=1');
  });

  it('falls back to the saved reference when the status has none', () => {
    const view = toGuestViewState({ ...EMPTY_SNAPSHOT, notFound: true, savedReference: 'VND-7' });
    expect(view.reference).toBe('VND-7');
  });
});

describe('safePayUrl', () => {
  it('only allows same-origin pay paths', () => {
    expect(safePayUrl('/pay?m=1')).toBe('/pay?m=1');
    expect(safePayUrl('https://evil.example/pay?m=1')).toBeNull();
    expect(safePayUrl('//evil.example/pay?m=1')).toBeNull();
    expect(safePayUrl(null)).toBeNull();
  });
});

describe('parseReturnParams', () => {
  const ORDER = '6F1D3F7E-8B2A-4C1D-9E3F-0A1B2C3D4E5F';
  const MF_PAYMENT_ID = '07077323767392271273';
  const query = (patch: Partial<ReturnQuery>): ReturnQuery => ({
    order: null,
    paymentId: null,
    tapId: null,
    ...patch,
  });

  it('keeps a uuid payment id and a Tap charge id from a Tap return', () => {
    expect(parseReturnParams(query({ paymentId: ORDER, tapId: 'chg_TS02A1234567' }))).toEqual({
      paymentId: ORDER,
      tapId: 'chg_TS02A1234567',
      mfPaymentId: null,
    });
  });

  it("reads a MyFatoorah return's order and its payment id as the proof", () => {
    expect(parseReturnParams(query({ order: ORDER, paymentId: MF_PAYMENT_ID }))).toEqual({
      paymentId: ORDER,
      tapId: null,
      mfPaymentId: MF_PAYMENT_ID,
    });
  });

  it('never sends a Tap charge id with a MyFatoorah return', () => {
    const parsed = parseReturnParams(query({ order: ORDER, paymentId: MF_PAYMENT_ID, tapId: 'chg_TS02A1234567' }));
    expect(parsed).toMatchObject({ tapId: null, mfPaymentId: MF_PAYMENT_ID });
  });

  it('falls back to a uuid paymentId when the order is malformed', () => {
    expect(parseReturnParams(query({ order: 'nope', paymentId: ORDER }))).toMatchObject({ paymentId: ORDER });
    expect(parseReturnParams(query({ order: 'nope', paymentId: MF_PAYMENT_ID }))).toEqual({
      paymentId: null,
      tapId: null,
      mfPaymentId: null,
    });
  });

  it('drops malformed values', () => {
    const empty = { paymentId: null, tapId: null, mfPaymentId: null };
    expect(parseReturnParams(query({ paymentId: 'not-a-uuid', tapId: 'chg_x' }))).toEqual(empty);
    expect(parseReturnParams(query({ tapId: 'tok_123456789' }))).toEqual(empty);
    expect(parseReturnParams(query({ order: ORDER, paymentId: '0707x' }))).toEqual({
      paymentId: ORDER,
      tapId: null,
      mfPaymentId: null,
    });
  });
});
