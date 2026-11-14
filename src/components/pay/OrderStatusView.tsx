'use client';

import { FeatureErrorView } from '@/components/shop/FeatureErrorView';
import { config } from '@/config/env';
import { btnClass } from '@/components/shop/Btn';
import { statusCopy } from './order-status-copy';
import { DispenseView } from './DispenseView';
import { StatusProblem } from './StatusProblem';
import type { GuestPaidItem } from '@/types/guest-checkout';
import type { GuestViewState } from '@/utils/guest-view-state';

export interface OrderInfo {
  items: GuestPaidItem[];
  machineId: string | null;
  machineName: string | null;
}

interface OrderStatusViewProps {
  view: GuestViewState;
  order: OrderInfo;
  connectionIssue: boolean;
}

export function StatusConfirming({ connectionIssue }: { connectionIssue: boolean }) {
  const copy = statusCopy({ kind: 'waiting_payment', reference: null, confirmedUnits: 0, totalUnits: 0, retryUrl: null });
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-8 text-center">
      <span className="h-9 w-9 animate-spin rounded-full border-4 border-transparent border-r-vt-primary border-t-vt-primary" aria-hidden />
      <h1 className="mt-4 text-[16px] font-semibold tracking-[-0.16px]">{copy.title}</h1>
      <p className="mt-2 max-w-[280px] text-[13px] leading-[1.45] text-vt-grey" aria-live="polite">
        {copy.body}
      </p>
      {connectionIssue && <p className="mt-3 text-[12px] text-vt-yellow">Your connection looks unstable. Still checking...</p>}
    </div>
  );
}

function NotFound({ view }: { view: GuestViewState }) {
  const copy = statusCopy(view);
  return (
    <div className="px-5">
      <FeatureErrorView icon="missing" title={copy.title} message={copy.body}>
        {config.supportUrl && (
          <a href={config.supportUrl} target="_blank" rel="noopener noreferrer" className={`${btnClass('outline')} mx-auto max-w-[200px]`}>
            Contact support
          </a>
        )}
      </FeatureErrorView>
    </div>
  );
}

export function OrderStatusView({ view, order, connectionIssue }: OrderStatusViewProps) {
  switch (view.kind) {
    case 'waiting_payment':
      return <StatusConfirming connectionIssue={connectionIssue} />;
    case 'preparing':
    case 'dispensing':
    case 'completed':
      return <DispenseView view={view} order={order} connectionIssue={connectionIssue} />;
    case 'not_found':
      return <NotFound view={view} />;
    default:
      return <StatusProblem view={view} order={order} connectionIssue={connectionIssue} />;
  }
}
