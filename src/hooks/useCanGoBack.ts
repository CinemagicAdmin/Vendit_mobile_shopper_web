'use client';

import { useSyncExternalStore } from 'react';

const noSubscription = () => () => undefined;

function landedOnThisPage(): boolean {
  const entry = performance.getEntriesByType('navigation')[0];
  if (!entry) return true;
  try {
    return new URL(entry.name).pathname === window.location.pathname;
  } catch {
    return true;
  }
}

function cameFromThisSite(): boolean {
  try {
    return document.referrer !== '' && new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}

// A shopper who opened the page from a QR code has nowhere in this site to go back to.
export function useCanGoBack(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => window.history.length > 1 && (!landedOnThisPage() || cameFromThisSite()),
    () => false,
  );
}
