'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, SearchX, XCircle } from 'lucide-react';
import { config } from '@/config/env';
import { SUPPORT_KINDS, statusCopy, type StatusIcon } from './order-status-copy';
import type { GuestViewState } from '@/utils/guest-view-state';

interface OrderStatusViewProps {
  view: GuestViewState;
  connectionIssue: boolean;
}

const ICONS: Record<StatusIcon, ReactNode> = {
  spinner: <Loader2 className="h-16 w-16 text-[#4ECDC4] animate-spin" />,
  success: <CheckCircle2 className="h-16 w-16 text-green-500" />,
  failed: <XCircle className="h-16 w-16 text-red-500" />,
  warning: <AlertTriangle className="h-16 w-16 text-amber-500" />,
  missing: <SearchX className="h-16 w-16 text-gray-400" />,
};

const actionClass =
  'inline-flex items-center justify-center rounded-xl font-semibold px-6 py-3 text-base';

function RetryAction({ url }: { url: string | null }) {
  if (!url) {
    return (
      <p className="text-sm text-gray-500 mt-6">Scan the QR code on the machine to try again.</p>
    );
  }
  return (
    <Link href={url} className={`${actionClass} mt-6 bg-[#4ECDC4] text-white`}>
      Try again
    </Link>
  );
}

export function OrderStatusView({ view, connectionIssue }: OrderStatusViewProps) {
  const copy = statusCopy(view);
  const supportUrl = SUPPORT_KINDS.has(view.kind) ? config.supportUrl : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-gradient-to-b from-[#e8faf9] to-white">
      <div className="mb-6">{ICONS[copy.icon]}</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{copy.title}</h1>
      <p className="text-gray-500 max-w-xs" aria-live="polite">
        {copy.body}
      </p>
      {connectionIssue && copy.icon === 'spinner' && (
        <p className="text-xs text-amber-600 mt-3">Your connection looks unstable. Still checking...</p>
      )}
      {view.reference && (
        <div className="mt-6 rounded-xl bg-white shadow-sm px-5 py-3">
          <p className="text-xs text-gray-400">Order reference</p>
          <p className="font-mono font-semibold text-gray-900 select-all">{view.reference}</p>
        </div>
      )}
      {view.kind === 'payment_failed' && <RetryAction url={view.retryUrl} />}
      {supportUrl && (
        <a
          href={supportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${actionClass} mt-6 border-2 border-[#4ECDC4] text-[#2a9d95]`}
        >
          Contact support
        </a>
      )}
    </div>
  );
}
