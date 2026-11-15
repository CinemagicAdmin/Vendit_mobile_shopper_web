'use client';

import { AppPromoBanner } from '@/components/shop/AppPromoBanner';
import { PayNotice } from './PayNotice';
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

export function unavailableCopy(reason: GuestUnavailableReason | null): string {
  return (reason ? REASON_COPY[reason] : undefined) ?? FALLBACK_COPY;
}

export function PayUnavailable({ reason }: { reason: GuestUnavailableReason | null }) {
  return (
    <div className="space-y-2.5">
      <PayNotice tone="warning" title="This order cannot be paid here">
        {unavailableCopy(reason)} You have not been charged.
      </PayNotice>
      <AppPromoBanner place="general" />
    </div>
  );
}
