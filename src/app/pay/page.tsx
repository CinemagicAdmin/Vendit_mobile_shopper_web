'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { FeatureErrorView } from '@/components/shop/FeatureErrorView';
import { GuestCheckout } from '@/components/pay/GuestCheckout';
import { AppPromoBanner } from '@/components/shop/AppPromoBanner';
import { CheckoutShell, CheckoutSkeleton } from '@/components/pay/CheckoutParts';
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
      <CheckoutShell>
        <FeatureErrorView
          icon="info"
          title="Invalid QR code"
          message="This QR code could not be read. Please scan the QR code on the machine again."
        >
          <AppPromoBanner place="general" />
        </FeatureErrorView>
      </CheckoutShell>
    );
  }

  return <GuestCheckout basket={parsed.basket} />;
}

export default function PayPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <PayContent />
    </Suspense>
  );
}
