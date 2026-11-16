'use client';

import { useEffect, useState } from 'react';
import { GuestOrderPoller } from '@/services/guest-order-poller';
import { EMPTY_SNAPSHOT, type GuestOrderSnapshot } from '@/utils/guest-view-state';
import type { GuestReturnProof } from '@/types/guest-checkout';

export function useGuestOrderStatus(paymentId: string | null, proof: GuestReturnProof): GuestOrderSnapshot {
  const [snapshot, setSnapshot] = useState<GuestOrderSnapshot>(EMPTY_SNAPSHOT);
  const { tapId, mfPaymentId } = proof;

  useEffect(() => {
    if (!paymentId) return;
    const poller = new GuestOrderPoller(paymentId, { tapId, mfPaymentId }, (patch) =>
      setSnapshot((current) => ({ ...current, ...patch })),
    );
    poller.start();
    return poller.stop;
  }, [paymentId, tapId, mfPaymentId]);

  return snapshot;
}
