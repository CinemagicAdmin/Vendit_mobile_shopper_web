import { config } from '@/config/env';
import { platformOf, type Platform } from '@/utils/app-store';
import {
  isWebId,
  newWebId,
  toBatches,
  toWebEvent,
  type WebEvent,
  type WebEventDetails,
  type WebEventType,
} from '@/utils/web-funnel';

const VISITOR_KEY = 'vendit_vid';
const VISIT_KEY = 'vendit_visit';
const ONCE_PREFIX = 'vendit_funnel_once:';
const FLUSH_SIZE = 10;
const FLUSH_DELAY_MS = 1500;

const pageIds = new Map<string, string>();
const seenThisPage = new Set<string>();
let queue: WebEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | undefined;
let listening = false;

const inBrowser = () => typeof window !== 'undefined';

function storedId(key: string, storage: () => Storage): string {
  const known = pageIds.get(key);
  if (known) return known;
  let id = newWebId();
  try {
    const saved = storage().getItem(key);
    if (isWebId(saved)) id = saved;
    else storage().setItem(key, id);
  } catch {
    // Blocked storage: the id lives for this page only.
  }
  pageIds.set(key, id);
  return id;
}

export function webVisitorIds(): { visitorId: string; visitId: string } {
  if (!inBrowser()) return { visitorId: newWebId(), visitId: newWebId() };
  return {
    visitorId: storedId(VISITOR_KEY, () => window.localStorage),
    visitId: storedId(VISIT_KEY, () => window.sessionStorage),
  };
}

function currentPlatform(): Platform {
  try {
    return platformOf(navigator.userAgent, navigator.maxTouchPoints);
  } catch {
    return 'other';
  }
}

// A plain string body goes as text/plain, so the cross-origin beacon needs no preflight.
function send(body: string): void {
  const url = `${config.apiUrl}/web-funnel/events`;
  try {
    if (typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(url, body)) return;
  } catch {
    // Fall through to fetch.
  }
  try {
    const init: RequestInit = { method: 'POST', body, keepalive: true, credentials: 'omit' };
    void fetch(url, { ...init, headers: { 'Content-Type': 'text/plain' } }).catch(() => undefined);
  } catch {
    // Tracking never breaks the page.
  }
}

export function flushWebEvents(): void {
  if (!inBrowser()) return;
  try {
    clearTimeout(flushTimer);
    flushTimer = undefined;
    const events = queue;
    queue = [];
    if (events.length === 0) return;
    const visit = { ...webVisitorIds(), platform: currentPlatform() };
    toBatches(visit, events).forEach((batch) => send(JSON.stringify(batch)));
  } catch {
    // Tracking never breaks the page.
  }
}

function flushWhenHidden(): void {
  if (document.visibilityState === 'hidden') flushWebEvents();
}

function listenForExit(): void {
  if (listening) return;
  listening = true;
  window.addEventListener('pagehide', flushWebEvents);
  document.addEventListener('visibilitychange', flushWhenHidden);
}

/** Queues one event and returns its id; never throws, and does nothing on the server. */
export function trackWebEvent(type: WebEventType, details: WebEventDetails = {}): string {
  const id = newWebId();
  if (!inBrowser()) return id;
  try {
    const event = toWebEvent({ ...details, id, type, at: new Date().toISOString() });
    if (!event) return id;
    queue.push(event);
    listenForExit();
    clearTimeout(flushTimer);
    if (queue.length >= FLUSH_SIZE) flushWebEvents();
    else flushTimer = setTimeout(flushWebEvents, FLUSH_DELAY_MS);
  } catch {
    // Tracking never breaks the page.
  }
  return id;
}

/** True the first time a key is seen in this visit (tab session), false after. */
export function firstTimeThisVisit(key: string): boolean {
  if (!inBrowser() || seenThisPage.has(key)) return false;
  seenThisPage.add(key);
  try {
    if (window.sessionStorage.getItem(ONCE_PREFIX + key)) return false;
    window.sessionStorage.setItem(ONCE_PREFIX + key, '1');
  } catch {
    // Blocked storage: once per page instead.
  }
  return true;
}

export function trackOncePerVisit(key: string, type: WebEventType, details: WebEventDetails = {}): void {
  if (firstTimeThisVisit(key)) trackWebEvent(type, details);
}
