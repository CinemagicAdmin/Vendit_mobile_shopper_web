'use client';

import Link from 'next/link';
import { CircleAlert, TriangleAlert } from 'lucide-react';
import { btnClass } from '@/components/shop/Btn';
import { HintToast } from '@/components/shop/HintToast';
import { config } from '@/config/env';
import { useHintToast } from '@/hooks/useHintToast';
import { machineUrl } from '@/utils/guest-cart-url';
import { SUPPORT_KINDS, statusCopy } from './order-status-copy';
import { OrderDetails } from './OrderDetails';
import type { GuestViewState } from '@/utils/guest-view-state';
import type { OrderInfo } from './OrderStatusView';

interface StatusProblemProps {
  view: GuestViewState;
  order: OrderInfo;
  connectionIssue: boolean;
}

function PrimaryAction({ view }: { view: GuestViewState }) {
  if (view.kind === 'payment_failed') {
    if (!view.retryUrl) {
      return <p className="py-2 text-center text-[13px] text-vt-grey">Scan the QR code on the machine to try again.</p>;
    }
    return (
      <Link href={view.retryUrl} className={btnClass('primary')}>
        Try again
      </Link>
    );
  }
  const supportUrl = SUPPORT_KINDS.has(view.kind) ? config.supportUrl : null;
  if (!supportUrl) return null;
  return (
    <a href={supportUrl} target="_blank" rel="noopener noreferrer" className={btnClass('primary')}>
      Contact support
    </a>
  );
}

export function StatusProblem({ view, order, connectionIssue }: StatusProblemProps) {
  const copy = statusCopy(view);
  const { toast, show } = useHintToast();
  const failedPayment = view.kind === 'payment_failed';
  const Icon = failedPayment ? CircleAlert : TriangleAlert;
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex flex-1 flex-col items-center px-6 pb-4 pt-12 text-center">
        <Icon className={failedPayment ? 'h-11 w-11 text-vt-danger' : 'h-11 w-11 text-vt-yellow'} strokeWidth={1.8} />
        <h1 className="mt-4 text-[18px] font-semibold leading-[1.3]">{copy.title}</h1>
        <p className="mt-2.5 text-[14px] font-medium leading-[1.5] text-vt-grey" aria-live="polite">
          {copy.body}
        </p>
        {connectionIssue && (
          <p className="mt-2 text-[12px] text-vt-yellow">Your connection looks unstable. Still checking...</p>
        )}
        <OrderDetails reference={view.reference} machineName={order.machineName} items={order.items} onCopied={show} />
      </div>
      <footer className="sticky bottom-0 space-y-2 border-t border-vt-line bg-white px-6 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
        <PrimaryAction view={view} />
        {order.machineId && (
          <Link href={machineUrl(order.machineId)} className={btnClass('ghost')}>
            Back to machine
          </Link>
        )}
      </footer>
      <HintToast toast={toast} />
    </div>
  );
}
