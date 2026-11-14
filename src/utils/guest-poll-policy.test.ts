import { describe, expect, it } from 'vitest';
import {
  dispenseSettled,
  isTerminalStatus,
  needsDispense,
  nextPollDelayMs,
  pollTimedOut,
} from '@/utils/guest-poll-policy';
import type { GuestCheckoutStatus, GuestDispense, GuestOutcome } from '@/types/guest-checkout';

function status(outcome: GuestOutcome, dispense: Partial<GuestDispense> | null = null): GuestCheckoutStatus {
  return {
    paymentId: 'p',
    orderReference: null,
    outcome,
    status: '',
    amount: 1,
    currency: 'KWD',
    checkoutUrl: null,
    machine: { name: null },
    dispense: dispense && {
      state: 'not_started',
      isComplete: false,
      authorizedUnits: 1,
      confirmedUnits: 0,
      failedUnits: 0,
      inFlightUnits: 0,
      ...dispense,
    },
    pollIntervalMs: 2000,
  };
}

describe('nextPollDelayMs', () => {
  it('follows the server interval within bounds', () => {
    expect(nextPollDelayMs(0, 3000)).toBe(3000);
    expect(nextPollDelayMs(0, 50)).toBe(1000);
    expect(nextPollDelayMs(0, 60_000)).toBe(15000);
  });

  it('defaults to 2 s when the interval is missing or invalid', () => {
    expect(nextPollDelayMs(0, null)).toBe(2000);
    expect(nextPollDelayMs(0, 0)).toBe(2000);
    expect(nextPollDelayMs(0, Number.NaN)).toBe(2000);
  });

  it('backs off to at least 5 s after the first minute', () => {
    expect(nextPollDelayMs(59_999, 2000)).toBe(2000);
    expect(nextPollDelayMs(60_000, 2000)).toBe(5000);
    expect(nextPollDelayMs(60_000, 8000)).toBe(8000);
  });
});

describe('pollTimedOut', () => {
  it('stops after ten minutes', () => {
    expect(pollTimedOut(599_999)).toBe(false);
    expect(pollTimedOut(600_000)).toBe(true);
  });
});

describe('isTerminalStatus and needsDispense', () => {
  it('treats failed payments and finished dispenses as terminal', () => {
    expect(isTerminalStatus(status('failed'))).toBe(true);
    expect(isTerminalStatus(status('succeeded', { state: 'completed', isComplete: true }))).toBe(true);
    expect(isTerminalStatus(status('succeeded', { state: 'partial', isComplete: true }))).toBe(true);
    expect(isTerminalStatus(status('succeeded', { state: 'dispensing' }))).toBe(false);
    expect(isTerminalStatus(status('pending'))).toBe(false);
    expect(isTerminalStatus(status('review'))).toBe(false);
  });

  it('asks for a dispense only for a paid order that has not started', () => {
    expect(needsDispense(status('succeeded'))).toBe(true);
    expect(needsDispense(status('succeeded', { state: 'not_started' }))).toBe(true);
    expect(needsDispense(status('succeeded', { state: 'dispensing' }))).toBe(false);
    expect(needsDispense(status('pending'))).toBe(false);
    expect(needsDispense(status('review'))).toBe(false);
  });

  it('only not_paid leaves the dispense request open', () => {
    expect(dispenseSettled('not_paid')).toBe(false);
    expect(dispenseSettled('send_failed')).toBe(false);
    expect(dispenseSettled('dispatched')).toBe(true);
    expect(dispenseSettled('machine_offline')).toBe(true);
  });
});
