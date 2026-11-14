'use client';

import { useEffect, useState } from 'react';
import { guestCheckoutService } from '@/services/guest-checkout.service';
import { toGuestApiError, type GuestApiError } from '@/utils/guest-api-error';
import type { GuestBasket, GuestQuote } from '@/types/guest-checkout';

export type GuestQuoteState =
  | { kind: 'loading' }
  | { kind: 'ready'; quote: GuestQuote }
  | { kind: 'error'; error: GuestApiError };

async function loadQuote(basket: GuestBasket): Promise<GuestQuoteState> {
  try {
    return { kind: 'ready', quote: await guestCheckoutService.getQuote(basket) };
  } catch (caught: unknown) {
    return { kind: 'error', error: toGuestApiError(caught) };
  }
}

export function useGuestQuote(basket: GuestBasket) {
  const [state, setState] = useState<GuestQuoteState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    void loadQuote(basket).then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, [basket]);

  const refresh = async (): Promise<GuestQuote | null> => {
    const next = await loadQuote(basket);
    setState(next);
    return next.kind === 'ready' ? next.quote : null;
  };

  const retry = () => {
    setState({ kind: 'loading' });
    void refresh();
  };

  return { state, refresh, retry };
}
