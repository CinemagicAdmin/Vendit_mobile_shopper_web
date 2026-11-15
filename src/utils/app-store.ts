export type Platform = 'ios' | 'android' | 'other';

export interface StoreLink {
  store: 'ios' | 'android';
  label: string;
  href: string;
}

export function platformOf(userAgent: string, maxTouchPoints = 0): Platform {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
  // iPadOS Safari reports itself as a Mac; only touch support tells them apart.
  if (/Macintosh/i.test(userAgent) && maxTouchPoints > 1) return 'ios';
  return /Android/i.test(userAgent) ? 'android' : 'other';
}

/** One button for the shopper's own phone; both stores on anything else. */
export function storeLinksFor(
  platform: Platform,
  urls: { ios: string | null; android: string | null },
): StoreLink[] {
  const ios = urls.ios ? { store: 'ios' as const, label: 'App Store', href: urls.ios } : null;
  const android = urls.android ? { store: 'android' as const, label: 'Google Play', href: urls.android } : null;
  if (platform === 'ios' && ios) return [{ ...ios, label: 'Download on the App Store' }];
  if (platform === 'android' && android) return [{ ...android, label: 'Get it on Google Play' }];
  return [ios, android].filter((link): link is StoreLink => link !== null);
}
