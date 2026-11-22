import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { config } from '@/config/env';
import type { WebEventBatch } from '@/utils/web-funnel';

class MemoryStorage {
  private items = new Map<string, string>();
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.items.set(key, value);
  }
}

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148';
const ENDPOINT = `${config.apiUrl}/web-funnel/events`;
const ID = /^[A-Za-z0-9_-]{22}$/;

type Beacon = (url: string, body: string) => boolean;

interface BrowserOptions {
  beacon?: Beacon | null;
  local?: MemoryStorage;
  session?: MemoryStorage;
  blocked?: boolean;
}

function blockedStorage(): never {
  throw new Error('storage blocked');
}

function stubBrowser(options: BrowserOptions = {}) {
  const local = options.local ?? new MemoryStorage();
  const session = options.session ?? new MemoryStorage();
  const onWindow = new Map<string, () => void>();
  const onDocument = new Map<string, () => void>();
  const page = { visibilityState: 'visible', addEventListener: (type: string, fn: () => void) => onDocument.set(type, fn) };
  vi.stubGlobal('window', {
    get localStorage() {
      return options.blocked ? blockedStorage() : local;
    },
    get sessionStorage() {
      return options.blocked ? blockedStorage() : session;
    },
    addEventListener: (type: string, fn: () => void) => onWindow.set(type, fn),
  });
  vi.stubGlobal('document', page);
  const beacon = options.beacon === null ? undefined : vi.fn<Beacon>(options.beacon ?? (() => true));
  vi.stubGlobal('navigator', { userAgent: IPHONE, maxTouchPoints: 5, sendBeacon: beacon });
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => new Response(String(init.body ?? url), { status: 202 }));
  vi.stubGlobal('fetch', fetchMock);
  return { local, session, onWindow, onDocument, page, beacon, fetchMock };
}

const load = async () => {
  vi.resetModules();
  return import('@/services/web-funnel');
};

const sentBatches = (beacon: Mock<Beacon> | undefined): WebEventBatch[] =>
  (beacon?.mock.calls ?? []).map(([, body]) => JSON.parse(body) as WebEventBatch);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-22T10:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('on the server', () => {
  it('does nothing and never throws', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const funnel = await load();
    expect(funnel.trackWebEvent('menu_viewed', { machineId: 'VM-1' })).toMatch(ID);
    expect(() => funnel.flushWebEvents()).not.toThrow();
    expect(funnel.firstTimeThisVisit('menu_viewed:VM-1')).toBe(false);
    vi.advanceTimersByTime(5000);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('visitor and visit ids', () => {
  it('keeps the visitor id in localStorage and the visit id in sessionStorage', async () => {
    const browser = stubBrowser();
    const funnel = await load();
    const ids = funnel.webVisitorIds();
    expect(ids.visitorId).toMatch(ID);
    expect(ids.visitId).toMatch(ID);
    expect(browser.local.getItem('vendit_vid')).toBe(ids.visitorId);
    expect(browser.session.getItem('vendit_visit')).toBe(ids.visitId);
    stubBrowser({ local: browser.local, session: browser.session });
    expect((await load()).webVisitorIds()).toEqual(ids);
  });

  it('replaces a stored id the ingest would reject', async () => {
    const local = new MemoryStorage();
    local.setItem('vendit_vid', 'bad id');
    stubBrowser({ local });
    const { visitorId } = (await load()).webVisitorIds();
    expect(visitorId).toMatch(ID);
    expect(local.getItem('vendit_vid')).toBe(visitorId);
  });

  it('falls back to ids that last for the page when storage is blocked', async () => {
    stubBrowser({ blocked: true });
    const funnel = await load();
    const ids = funnel.webVisitorIds();
    expect(ids.visitorId).toMatch(ID);
    expect(funnel.webVisitorIds()).toEqual(ids);
    expect((await load()).webVisitorIds()).not.toEqual(ids);
  });
});

describe('trackWebEvent', () => {
  it('beacons the batch shape the ingest expects, 1.5 s after the last event', async () => {
    const browser = stubBrowser();
    const funnel = await load();
    const menuId = funnel.trackWebEvent('menu_viewed', { machineId: 'VM-1' });
    vi.advanceTimersByTime(1000);
    const clickId = funnel.trackWebEvent('promo_clicked', { place: 'machine', machineId: 'VM-1' });
    vi.advanceTimersByTime(1499);
    expect(browser.beacon).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(browser.beacon).toHaveBeenCalledTimes(1);
    expect(browser.beacon?.mock.calls[0]?.[0]).toBe(ENDPOINT);
    expect(sentBatches(browser.beacon)).toEqual([
      {
        ...funnel.webVisitorIds(),
        platform: 'ios',
        events: [
          { id: menuId, type: 'menu_viewed', at: '2026-11-22T10:00:00.000Z', machineId: 'VM-1' },
          { id: clickId, type: 'promo_clicked', at: '2026-11-22T10:00:01.000Z', machineId: 'VM-1', place: 'machine' },
        ],
      },
    ]);
  });

  it('sends at once when 10 events are queued', async () => {
    const browser = stubBrowser();
    const funnel = await load();
    for (let index = 0; index < 10; index += 1) funnel.trackWebEvent('menu_viewed');
    expect(browser.beacon).toHaveBeenCalledTimes(1);
    expect(sentBatches(browser.beacon)[0]?.events).toHaveLength(10);
  });

  it('flushes when the page is hidden or left', async () => {
    const browser = stubBrowser();
    const funnel = await load();
    funnel.trackWebEvent('checkout_viewed', { machineId: 'VM-1' });
    browser.onDocument.get('visibilitychange')?.();
    expect(browser.beacon).not.toHaveBeenCalled();
    browser.page.visibilityState = 'hidden';
    browser.onDocument.get('visibilitychange')?.();
    expect(browser.beacon).toHaveBeenCalledTimes(1);
    funnel.trackWebEvent('payment_started', { machineId: 'VM-1' });
    browser.onWindow.get('pagehide')?.();
    expect(browser.beacon).toHaveBeenCalledTimes(2);
  });

  it('drops an event the ingest would reject', async () => {
    const browser = stubBrowser();
    const funnel = await load();
    funnel.trackWebEvent('promo_viewed');
    funnel.flushWebEvents();
    expect(browser.beacon).not.toHaveBeenCalled();
  });
});

describe('delivery fallback', () => {
  const expectFetched = (fetchMock: ReturnType<typeof stubBrowser>['fetchMock']) => {
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(ENDPOINT);
    expect(init).toMatchObject({
      method: 'POST',
      keepalive: true,
      credentials: 'omit',
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(JSON.parse(String(init?.body)).events).toHaveLength(1);
  };

  it('uses fetch with keepalive when sendBeacon refuses the body', async () => {
    const browser = stubBrowser({ beacon: () => false });
    const funnel = await load();
    funnel.trackWebEvent('menu_viewed');
    funnel.flushWebEvents();
    expect(browser.beacon).toHaveBeenCalledTimes(1);
    expectFetched(browser.fetchMock);
  });

  it('uses fetch when sendBeacon is missing, and swallows a failed fetch', async () => {
    const browser = stubBrowser({ beacon: null });
    browser.fetchMock.mockRejectedValueOnce(new TypeError('offline'));
    const funnel = await load();
    funnel.trackWebEvent('menu_viewed');
    expect(() => funnel.flushWebEvents()).not.toThrow();
    expectFetched(browser.fetchMock);
    await vi.runAllTimersAsync();
  });

  it('never throws when sendBeacon itself throws', async () => {
    const browser = stubBrowser({
      beacon: () => {
        throw new Error('beacon blew up');
      },
    });
    const funnel = await load();
    funnel.trackWebEvent('menu_viewed');
    expect(() => funnel.flushWebEvents()).not.toThrow();
    expectFetched(browser.fetchMock);
  });
});

describe('once per visit', () => {
  it('is true only the first time a key is seen in a visit', async () => {
    const browser = stubBrowser();
    const funnel = await load();
    expect(funnel.firstTimeThisVisit('menu_viewed:VM-1')).toBe(true);
    expect(funnel.firstTimeThisVisit('menu_viewed:VM-1')).toBe(false);
    expect(funnel.firstTimeThisVisit('menu_viewed:VM-2')).toBe(true);
    stubBrowser({ session: browser.session });
    expect((await load()).firstTimeThisVisit('menu_viewed:VM-1')).toBe(false);
  });

  it('falls back to once per page when storage is blocked', async () => {
    stubBrowser({ blocked: true });
    const funnel = await load();
    expect(funnel.firstTimeThisVisit('promo_viewed:machine')).toBe(true);
    expect(funnel.firstTimeThisVisit('promo_viewed:machine')).toBe(false);
  });

  it('tracks the event only once', async () => {
    const browser = stubBrowser();
    const funnel = await load();
    funnel.trackOncePerVisit('promo_viewed:checkout', 'promo_viewed', { place: 'checkout' });
    funnel.trackOncePerVisit('promo_viewed:checkout', 'promo_viewed', { place: 'checkout' });
    funnel.flushWebEvents();
    expect(sentBatches(browser.beacon)[0]?.events).toHaveLength(1);
  });
});
