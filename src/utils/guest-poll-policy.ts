import type { GuestCheckoutStatus, GuestDispenseResult } from '@/types/guest-checkout';

export const DEFAULT_POLL_MS = 2000;
export const SLOW_POLL_MS = 5000;
export const SLOW_AFTER_MS = 60_000;
export const POLL_LIMIT_MS = 10 * 60_000;
export const DISPENSE_COOLDOWN_MS = 60_000;
export const MAX_DISPENSE_ATTEMPTS = 3;
const MIN_POLL_MS = 1000;
const MAX_POLL_MS = 15000;

export function nextPollDelayMs(elapsedMs: number, pollIntervalMs: number | null): number {
  const valid = pollIntervalMs !== null && Number.isFinite(pollIntervalMs) && pollIntervalMs > 0;
  const base = valid ? Math.min(Math.max(pollIntervalMs, MIN_POLL_MS), MAX_POLL_MS) : DEFAULT_POLL_MS;
  return elapsedMs >= SLOW_AFTER_MS ? Math.max(base, SLOW_POLL_MS) : base;
}

export function pollTimedOut(elapsedMs: number): boolean {
  return elapsedMs >= POLL_LIMIT_MS;
}

export function isTerminalStatus(status: GuestCheckoutStatus): boolean {
  if (status.outcome === 'failed') return true;
  return status.outcome === 'succeeded' && status.dispense?.isComplete === true;
}

export function needsDispense(status: GuestCheckoutStatus): boolean {
  if (status.outcome !== 'succeeded') return false;
  return status.dispense === null || status.dispense.state === 'not_started';
}

// Settlement not landed yet, or the send itself failed: a later attempt can still help.
export function dispenseSettled(result: GuestDispenseResult): boolean {
  return result !== 'not_paid' && result !== 'send_failed';
}
