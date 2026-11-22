'use client';

import { BottomSheet } from '@/components/shop/BottomSheet';
import { AppDownloadCta } from '@/components/pay/AppDownloadCta';

const MESSAGES = {
  offer: 'Offers and exclusives like this one are claimed in the app.',
  checkout: 'Order from this machine in the app.',
};

interface AppOnlySheetProps {
  reason: keyof typeof MESSAGES;
  machineId: string;
  onClose: () => void;
}

export function AppOnlySheet({ reason, machineId, onClose }: AppOnlySheetProps) {
  return (
    <BottomSheet label="Get the app" onClose={onClose}>
      <div className="pb-3 pt-2">
        <AppDownloadCta bare place="app_only" machineId={machineId} message={MESSAGES[reason]} />
      </div>
    </BottomSheet>
  );
}
