'use client';

import { useRef, useState } from 'react';

const SHOWN_MS = 1600;

export interface HintToastState {
  id: number;
  message: string;
}

export function useHintToast() {
  const [toast, setToast] = useState<HintToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = (message: string) => {
    clearTimeout(timer.current);
    setToast((current) => ({ id: (current?.id ?? 0) + 1, message }));
    timer.current = setTimeout(() => setToast(null), SHOWN_MS);
  };

  return { toast, show };
}
