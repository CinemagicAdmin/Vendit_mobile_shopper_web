'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sameLines, type CartLine } from '@/utils/guest-cart';
import { payUrlFor } from '@/utils/guest-cart-url';
import type { GuestBasket } from '@/types/guest-checkout';

// Taps settle before the URL (and so the quote) follows, which keeps a burst of taps to one request.
const SETTLE_MS = 450;

interface Draft {
  baseKey: string;
  lines: CartLine[];
}

export function useCheckoutDraft(basket: GuestBasket) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const pending = timer;
    return () => clearTimeout(pending.current);
  }, []);

  const lines = draft && draft.baseKey === basket.key ? draft.lines : basket.lines;

  const change = (next: CartLine[]) => {
    setDraft({ baseKey: basket.key, lines: next });
    clearTimeout(timer.current);
    if (next.length === 0) return;
    timer.current = setTimeout(
      () => router.replace(payUrlFor(basket.machineId, next), { scroll: false }),
      SETTLE_MS,
    );
  };

  return { lines, editing: !sameLines(lines, basket.lines), change };
}
