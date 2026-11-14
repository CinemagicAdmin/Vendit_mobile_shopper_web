import type { GuestCheckoutStatus, GuestDispenseResult } from '@/types/guest-checkout';

export interface GuestOrderSnapshot {
  status: GuestCheckoutStatus | null;
  dispenseResult: GuestDispenseResult | null;
  notFound: boolean;
  timedOut: boolean;
  connectionIssue: boolean;
  payUrl: string | null;
  savedReference: string | null;
}

export type GuestViewKind =
  | 'waiting_payment'
  | 'payment_failed'
  | 'review'
  | 'preparing'
  | 'dispensing'
  | 'completed'
  | 'partial'
  | 'machine_offline'
  | 'not_found'
  | 'timeout';

export interface GuestViewState {
  kind: GuestViewKind;
  reference: string | null;
  confirmedUnits: number;
  totalUnits: number;
  retryUrl: string | null;
}

export const EMPTY_SNAPSHOT: GuestOrderSnapshot = {
  status: null,
  dispenseResult: null,
  notFound: false,
  timedOut: false,
  connectionIssue: false,
  payUrl: null,
  savedReference: null,
};

const PAYMENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TAP_ID_PATTERN = /^chg_[A-Za-z0-9_]{6,64}$/;

export function parseReturnParams(paymentId: string | null, tapId: string | null) {
  return {
    paymentId: paymentId && PAYMENT_ID_PATTERN.test(paymentId) ? paymentId : null,
    tapId: tapId && TAP_ID_PATTERN.test(tapId) ? tapId : null,
  };
}

export function safePayUrl(payUrl: string | null): string | null {
  return payUrl && payUrl.startsWith('/pay?') ? payUrl : null;
}

function succeededKind(status: GuestCheckoutStatus, snapshot: GuestOrderSnapshot): GuestViewKind {
  const { dispense } = status;
  if (dispense?.isComplete) {
    return dispense.state === 'partial' || dispense.state === 'failed' ? 'partial' : 'completed';
  }
  if (snapshot.timedOut) return 'timeout';
  if (dispense && dispense.state !== 'not_started') return 'dispensing';
  if (snapshot.dispenseResult === 'machine_offline') return 'machine_offline';
  if (snapshot.dispenseResult === 'no_coil') return 'partial';
  return 'preparing';
}

function viewKind(snapshot: GuestOrderSnapshot): GuestViewKind {
  const { status } = snapshot;
  if (snapshot.notFound) return 'not_found';
  if (status?.outcome === 'failed') return 'payment_failed';
  if (status?.outcome === 'succeeded') return succeededKind(status, snapshot);
  if (status?.outcome === 'review') return 'review';
  return snapshot.timedOut ? 'timeout' : 'waiting_payment';
}

export function toGuestViewState(snapshot: GuestOrderSnapshot): GuestViewState {
  const kind = viewKind(snapshot);
  const dispense = snapshot.status?.dispense ?? null;
  return {
    kind,
    reference: snapshot.status?.orderReference ?? snapshot.savedReference,
    confirmedUnits: dispense?.confirmedUnits ?? 0,
    totalUnits: dispense?.authorizedUnits ?? 0,
    retryUrl: kind === 'payment_failed' ? safePayUrl(snapshot.payUrl) : null,
  };
}
