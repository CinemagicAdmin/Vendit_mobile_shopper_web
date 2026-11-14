'use client';

import { BottomSheet } from '@/components/shop/BottomSheet';
import { AppDownloadCta } from '@/components/pay/AppDownloadCta';

const MESSAGES = {
  offer: 'Offers and exclusives like this one are claimed in the app.',
  checkout: 'Order from this machine in the app.',
};

export function AppOnlySheet({ reason, onClose }: { reason: keyof typeof MESSAGES; onClose: () => void }) {
  return (
    <BottomSheet label="Get the app" onClose={onClose}>
      <div className="pb-3 pt-2">
        <AppDownloadCta bare message={MESSAGES[reason]} />
      </div>
    </BottomSheet>
  );
}
