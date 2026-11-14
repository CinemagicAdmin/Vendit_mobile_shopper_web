'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorScreen } from '@/components/ui/ErrorScreen';
import { GuestCheckout } from '@/components/pay/GuestCheckout';
import { AppDownloadCta } from '@/components/pay/AppDownloadCta';
import { parseGuestBasket } from '@/utils/guest-basket';
import { guestStorage } from '@/utils/guest-storage';

function PayContent() {
  const searchParams = useSearchParams();
  const m = searchParams.get('m');
  const p = searchParams.get('p');
  const q = searchParams.get('q');
  const parsed = useMemo(() => parseGuestBasket({ m, p, q }), [m, p, q]);

  useEffect(() => {
    guestStorage.sweepExpired();
  }, []);

  if (!parsed.ok) {
    return (
      <div className="px-4 pb-10">
        <ErrorScreen
          title="Invalid QR code"
          message="This QR code could not be read. Please scan the QR code on the machine again."
        />
        <AppDownloadCta />
      </div>
    );
  }

  return <GuestCheckout key={parsed.basket.key} basket={parsed.basket} />;
}

export default function PayPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <PayContent />
    </Suspense>
  );
}
