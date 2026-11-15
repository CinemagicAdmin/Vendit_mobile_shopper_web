'use client';

import { useSyncExternalStore } from 'react';
import { platformOf, type Platform } from '@/utils/app-store';

const DISMISS_PREFIX = 'vendit_promo_dismissed:';
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const noChanges = () => () => {};

function readDismissed(key: string): boolean {
  try {
    return window.sessionStorage.getItem(DISMISS_PREFIX + key) === '1';
  } catch {
    return false;
  }
}

/** The shopper's phone; 'other' until hydrated, so the server and first render offer both stores. */
export function usePlatform(): Platform {
  return useSyncExternalStore(
    noChanges,
    () => platformOf(navigator.userAgent, navigator.maxTouchPoints),
    () => 'other',
  );
}

/** A banner closed with its X stays closed for the rest of this visit. */
export function useDismissed(key: string) {
  const dismissed = useSyncExternalStore(subscribe, () => readDismissed(key), () => false);
  const dismiss = () => {
    try {
      window.sessionStorage.setItem(DISMISS_PREFIX + key, '1');
    } catch {
      // Private mode: the banner simply comes back on the next page.
    }
    listeners.forEach((listener) => listener());
  };
  return { dismissed, dismiss };
}
