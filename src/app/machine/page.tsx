'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FeatureErrorView } from '@/components/shop/FeatureErrorView';
import { MachineScreen } from '@/components/machine/MachineScreen';
import { AppDownloadCta } from '@/components/pay/AppDownloadCta';

const MAX_ID_LENGTH = 64;

function MachineContent() {
  const searchParams = useSearchParams();
  const machineId = searchParams.get('m')?.trim() ?? '';
  if (!machineId || machineId.length > MAX_ID_LENGTH) {
    return (
      <div className="px-5">
        <FeatureErrorView
          icon="info"
          title="Invalid QR code"
          message="This QR code could not be read. Please scan the QR code on the machine again."
        >
          <AppDownloadCta />
        </FeatureErrorView>
      </div>
    );
  }
  return <MachineScreen key={machineId} machineId={machineId} productKey={searchParams.get('product')} />;
}

export default function MachinePage() {
  return (
    <Suspense fallback={null}>
      <MachineContent />
    </Suspense>
  );
}
