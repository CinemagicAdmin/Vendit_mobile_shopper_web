import { guestCheckoutService } from '@/services/guest-checkout.service';
import { guestStorage, type GuestPaymentRecord } from '@/utils/guest-storage';
import { toGuestApiError, type GuestApiError } from '@/utils/guest-api-error';
import {
  DISPENSE_COOLDOWN_MS,
  MAX_DISPENSE_ATTEMPTS,
  SLOW_POLL_MS,
  dispenseSettled,
  isTerminalStatus,
  needsDispense,
  nextPollDelayMs,
  pollTimedOut,
} from '@/utils/guest-poll-policy';
import type { GuestAuth, GuestCheckoutStatus } from '@/types/guest-checkout';
import type { GuestOrderSnapshot } from '@/utils/guest-view-state';

type Emit = (patch: Partial<GuestOrderSnapshot>) => void;

const LOST_STATUSES = new Set([401, 403, 404]);

export class GuestOrderPoller {
  private stopped = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private dispenseAttempts = 0;
  private dispenseDone = false;
  private pendingCleared = false;
  private readonly startedAt = Date.now();
  private readonly paymentId: string;
  private readonly emit: Emit;
  private readonly record: GuestPaymentRecord | null;
  private readonly auth: GuestAuth;

  constructor(paymentId: string, tapId: string | null, emit: Emit) {
    this.paymentId = paymentId;
    this.emit = emit;
    this.record = guestStorage.getPayment(paymentId);
    this.auth = { secret: this.record?.secret ?? null, tapId };
  }

  start(): void {
    const hasProof = this.auth.secret !== null || this.auth.tapId !== null;
    this.emit({
      payUrl: this.record?.payUrl ?? null,
      savedReference: this.record?.orderReference ?? null,
      notFound: !hasProof,
    });
    if (hasProof) void this.tick();
  }

  stop = (): void => {
    this.stopped = true;
    clearTimeout(this.timer);
  };

  private async tick(): Promise<void> {
    try {
      const status = await this.refresh();
      if (!this.stopped) this.afterStatus(status);
    } catch (caught: unknown) {
      if (!this.stopped) this.afterError(toGuestApiError(caught));
    }
  }

  private async refresh(): Promise<GuestCheckoutStatus> {
    const status = await guestCheckoutService.getStatus(this.paymentId, this.auth);
    if (this.stopped) return status;
    this.emit({ status, connectionIssue: false });
    return needsDispense(status) ? this.dispense(status) : status;
  }

  private async dispense(status: GuestCheckoutStatus): Promise<GuestCheckoutStatus> {
    if (this.dispenseDone || this.dispenseAttempts >= MAX_DISPENSE_ATTEMPTS) return status;
    if (guestStorage.dispenseRequestedWithin(this.paymentId, DISPENSE_COOLDOWN_MS)) return status;
    this.dispenseAttempts += 1;
    guestStorage.markDispenseRequested(this.paymentId);
    try {
      const response = await guestCheckoutService.requestDispense(this.paymentId, this.auth);
      this.dispenseDone = dispenseSettled(response.result);
      if (!this.stopped) this.emit({ status: response.status, dispenseResult: response.result });
      return response.status;
    } catch (caught: unknown) {
      const { status: code } = toGuestApiError(caught);
      // A definite 4xx will not change on retry; transport failures may, and the server backstop still vends.
      this.dispenseDone = code >= 400 && code < 500 && code !== 429;
      return status;
    }
  }

  private afterStatus(status: GuestCheckoutStatus): void {
    this.clearPendingWhenSettled(status);
    if (isTerminalStatus(status)) return;
    const elapsed = Date.now() - this.startedAt;
    if (pollTimedOut(elapsed)) {
      this.emit({ timedOut: true });
      return;
    }
    this.schedule(nextPollDelayMs(elapsed, status.pollIntervalMs));
  }

  private afterError(error: GuestApiError): void {
    if (LOST_STATUSES.has(error.status)) {
      this.emit({ notFound: true });
      return;
    }
    const elapsed = Date.now() - this.startedAt;
    if (pollTimedOut(elapsed)) {
      this.emit({ timedOut: true, connectionIssue: true });
      return;
    }
    this.emit({ connectionIssue: true });
    this.schedule(Math.max(nextPollDelayMs(elapsed, null), SLOW_POLL_MS));
  }

  private clearPendingWhenSettled(status: GuestCheckoutStatus): void {
    if (this.pendingCleared || !this.record) return;
    if (status.outcome !== 'succeeded' && status.outcome !== 'failed') return;
    this.pendingCleared = true;
    guestStorage.clearPendingSecret(this.record.basketKey);
  }

  private schedule(delayMs: number): void {
    if (this.stopped) return;
    this.timer = setTimeout(() => void this.tick(), delayMs);
  }
}
