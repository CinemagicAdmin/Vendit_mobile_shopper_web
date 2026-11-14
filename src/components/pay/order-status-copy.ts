import type { GuestViewKind, GuestViewState } from '@/utils/guest-view-state';

export type StatusIcon = 'spinner' | 'success' | 'failed' | 'warning' | 'missing';

export interface StatusCopy {
  icon: StatusIcon;
  title: string;
  body: string;
}

export const SUPPORT_KINDS = new Set<GuestViewKind>([
  'review',
  'partial',
  'machine_offline',
  'not_found',
  'timeout',
]);

function support(reference: string | null): string {
  return reference ? `contact support with reference ${reference}` : 'contact support';
}

function dispensed(view: GuestViewState): string {
  return view.totalUnits > 0 ? `${view.confirmedUnits} of ${view.totalUnits} items were dispensed. ` : '';
}

export function statusCopy(view: GuestViewState): StatusCopy {
  switch (view.kind) {
    case 'waiting_payment':
      return {
        icon: 'spinner',
        title: 'Confirming your payment\u2026',
        body: 'This usually takes a few seconds. Please keep this page open.',
      };
    case 'payment_failed':
      return { icon: 'failed', title: 'Payment not completed', body: 'You have not been charged.' };
    case 'review':
      return {
        icon: 'warning',
        title: 'Your payment is being checked',
        body: `If your items do not drop, ${support(view.reference)}.`,
      };
    case 'preparing':
      return { icon: 'spinner', title: 'Preparing your order', body: 'Sending your order to the machine...' };
    case 'dispensing':
      return { icon: 'spinner', title: 'Dispensing your items', body: 'Please stay near the machine.' };
    case 'completed':
      return {
        icon: 'success',
        title: 'Ready to collect',
        body: 'Take your items from the pickup tray at the bottom of the machine.',
      };
    case 'partial':
      return {
        icon: 'warning',
        title: view.confirmedUnits > 0 ? 'Some items were not dispensed' : 'Dispensing not completed',
        body: `${dispensed(view)}For a refund of anything that did not drop, ${support(view.reference)}.`,
      };
    case 'machine_offline':
      return {
        icon: 'warning',
        title: "We couldn't start your vend",
        body: `The machine is not responding, so your items could not be sent to it yet. If nothing drops, ${support(view.reference)} for a refund.`,
      };
    case 'not_found':
      return {
        icon: 'missing',
        title: 'We could not find this order',
        body: 'If you paid, the machine usually vends your items within a minute. If it does not, contact support.',
      };
    case 'timeout':
      return {
        icon: 'warning',
        title: 'This is taking longer than expected',
        body: `If you paid and your items did not drop, ${support(view.reference)}.`,
      };
  }
}
