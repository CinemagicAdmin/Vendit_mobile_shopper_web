export type Platform = 'ios' | 'android' | 'other';

export function platformOf(userAgent: string, maxTouchPoints = 0): Platform {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
  // iPadOS Safari reports itself as a Mac; only touch support tells them apart.
  if (/Macintosh/i.test(userAgent) && maxTouchPoints > 1) return 'ios';
  return /Android/i.test(userAgent) ? 'android' : 'other';
}

/** The store for the shopper's phone. A desktop can install neither, so it gets the App Store page. */
export function storeUrlFor(platform: Platform, urls: { ios: string | null; android: string | null }): string | null {
  if (platform === 'android') return urls.android ?? urls.ios;
  return urls.ios ?? urls.android;
}
