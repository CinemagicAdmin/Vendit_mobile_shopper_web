'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { OrderStatusView } from '@/components/pay/OrderStatusView';
import { useGuestOrderStatus } from '@/hooks/useGuestOrderStatus';
import { EMPTY_SNAPSHOT, parseReturnParams, toGuestViewState } from '@/utils/guest-view-state';

function ReturnContent() {
  const searchParams = useSearchParams();
  const { paymentId, tapId } = parseReturnParams(
    searchParams.get('paymentId'),
    searchParams.get('tap_id'),
  );
  const snapshot = useGuestOrderStatus(paymentId, tapId);
  const view = toGuestViewState(paymentId ? snapshot : { ...EMPTY_SNAPSHOT, notFound: true });

  return <OrderStatusView view={view} connectionIssue={snapshot.connectionIssue} />;
}

export default function PayReturnPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Checking your payment..." />}>
      <ReturnContent />
    </Suspense>
  );
}
