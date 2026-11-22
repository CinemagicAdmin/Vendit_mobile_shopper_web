'use client';

import { useCallback, useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react';
import { flushWebEvents, trackOncePerVisit, trackWebEvent } from '@/services/web-funnel';
import { appLinkFor, usesAppLink } from '@/utils/app-link';
import { platformOf, type Platform } from '@/utils/app-store';
import type { WebPromoPlace } from '@/utils/web-funnel';

const DISMISS_PREFIX = 'vendit_promo_dismissed:';
const SEEN_RATIO = 0.5;
const SEEN_MS = 1000;
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

export type AppLinkProps = Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel' | 'onClick'>;

/** The Get the app link props, or null when no store is configured. */
export function useAppLink(place: WebPromoPlace, machineId?: string | null): AppLinkProps | null {
  const click = { machineId, place, clickId: null, platform: usePlatform() };
  const href = appLinkFor(click);
  if (!href) return null;
  // A click handler runs before the browser follows the link, so the opened URL carries this click's id.
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const clickId = trackWebEvent('promo_clicked', { place, machineId });
    const tracked = appLinkFor({ ...click, clickId });
    if (tracked) event.currentTarget.href = tracked;
    flushWebEvents();
  };
  // The app link opens in this tab, the plainest path for the phone to hand it to the installed app.
  const opening = usesAppLink(click) ? { rel: 'noreferrer' } : { target: '_blank', rel: 'noopener noreferrer' };
  return { href, onClick, ...opening };
}

function watchView(node: Element, onSeen: () => void): (() => void) | undefined {
  if (typeof IntersectionObserver === 'undefined') return undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const observer = new IntersectionObserver(
    (entries) => {
      const ratio = entries[entries.length - 1]?.intersectionRatio ?? 0;
      if (ratio < SEEN_RATIO) {
        clearTimeout(timer);
        timer = undefined;
      } else if (timer === undefined) {
        timer = setTimeout(() => {
          observer.disconnect();
          onSeen();
        }, SEEN_MS);
      }
    },
    { threshold: [SEEN_RATIO, 0.75, 1] },
  );
  observer.observe(node);
  return () => {
    clearTimeout(timer);
    observer.disconnect();
  };
}

/** A ref that records promo_viewed once per place per visit, when the promo is half on screen for a second. */
export function usePromoView(place: WebPromoPlace, machineId?: string | null) {
  return useCallback(
    (node: HTMLElement | null) => {
      if (!node) return undefined;
      return watchView(node, () => trackOncePerVisit(`promo_viewed:${place}`, 'promo_viewed', { place, machineId }));
    },
    [place, machineId],
  );
}
