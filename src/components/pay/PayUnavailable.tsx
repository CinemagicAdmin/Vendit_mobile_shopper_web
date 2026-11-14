'use client';

import { AlertTriangle } from 'lucide-react';
import { AppDownloadCta } from './AppDownloadCta';
import type { GuestUnavailableReason } from '@/types/guest-checkout';

const FALLBACK_COPY = 'This order cannot be paid for right now.';

const REASON_COPY: Record<GuestUnavailableReason, string> = {
  FEATURE_DISABLED: 'Paying on the web is not available right now.',
  NOT_CONFIGURED: 'This machine does not take web payments yet.',
  MACHINE_OFFLINE: 'This machine is offline right now, so it cannot take your order.',
  OUT_OF_STOCK: 'Some of these items are sold out.',
  PRICE_UNAVAILABLE: 'We could not get a price for some of these items.',
  PRODUCT_UNAVAILABLE: 'Some of these items are not sold on this machine.',
};

export function PayUnavailable({ reason }: { reason: GuestUnavailableReason | null }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-gray-900">This order cannot be paid here</p>
          <p className="text-sm text-gray-600 mt-0.5">
            {(reason ? REASON_COPY[reason] : undefined) ?? FALLBACK_COPY} You have not been charged.
          </p>
        </div>
      </div>
      <AppDownloadCta />
    </div>
  );
}
