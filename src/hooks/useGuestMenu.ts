'use client';

import { useEffect, useState } from 'react';
import { guestCheckoutService } from '@/services/guest-checkout.service';
import { toGuestApiError, type GuestApiError } from '@/utils/guest-api-error';
import type { GuestMenu } from '@/types/guest-menu';

export type GuestMenuState =
  | { kind: 'loading' }
  | { kind: 'ready'; menu: GuestMenu }
  | { kind: 'error'; error: GuestApiError };

async function loadMenu(machineId: string): Promise<GuestMenuState> {
  try {
    return { kind: 'ready', menu: await guestCheckoutService.getMenu(machineId) };
  } catch (caught: unknown) {
    return { kind: 'error', error: toGuestApiError(caught) };
  }
}

export function useGuestMenu(machineId: string) {
  const [state, setState] = useState<GuestMenuState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    void loadMenu(machineId).then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, [machineId]);

  const retry = () => {
    setState({ kind: 'loading' });
    void loadMenu(machineId).then(setState);
  };

  return { state, retry };
}
