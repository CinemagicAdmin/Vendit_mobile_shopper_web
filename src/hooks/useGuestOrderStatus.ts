'use client';

import { useEffect, useState } from 'react';
import { GuestOrderPoller } from '@/services/guest-order-poller';
import { EMPTY_SNAPSHOT, type GuestOrderSnapshot } from '@/utils/guest-view-state';

export function useGuestOrderStatus(paymentId: string | null, tapId: string | null): GuestOrderSnapshot {
  const [snapshot, setSnapshot] = useState<GuestOrderSnapshot>(EMPTY_SNAPSHOT);

  useEffect(() => {
    if (!paymentId) return;
    const poller = new GuestOrderPoller(paymentId, tapId, (patch) =>
      setSnapshot((current) => ({ ...current, ...patch })),
    );
    poller.start();
    return poller.stop;
  }, [paymentId, tapId]);

  return snapshot;
}
