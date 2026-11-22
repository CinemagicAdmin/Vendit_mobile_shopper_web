// The app's public store pages: a build without the env values still links to them.
const IOS_STORE_URL = 'https://apps.apple.com/app/id6739774397';
const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=com.app.vendit';
const APP_LINK_URL = 'https://invite.tryvendit.com/machine';

function optionalUrl(value: string | undefined, protocols: string[]): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    // An app.link URL sends a shopper without the app straight back to this site.
    if (!protocols.includes(url.protocol) || url.hostname.endsWith('app.link')) return null;
    return url.href;
  } catch {
    return null;
  }
}

// A Branch host is allowed here, unlike a store URL: appLinkFor adds per-click store overrides (ADR-498).
function appLinkUrl(value: string | undefined): string | null {
  if (value === 'off') return null;
  try {
    const url = new URL(value || APP_LINK_URL);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://vendit-mobile-backend-updated-898380308450.asia-east2.run.app/api',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Vend IT',
  maxDistanceMeters: Number(process.env.NEXT_PUBLIC_MAX_DISTANCE_METERS || 100),
  iosStoreUrl: optionalUrl(process.env.NEXT_PUBLIC_IOS_STORE_URL || IOS_STORE_URL, ['https:']),
  androidStoreUrl: optionalUrl(process.env.NEXT_PUBLIC_ANDROID_STORE_URL || ANDROID_STORE_URL, ['https:']),
  supportUrl: optionalUrl(process.env.NEXT_PUBLIC_SUPPORT_URL, ['https:', 'mailto:', 'tel:']),
  appLinkUrl: appLinkUrl(process.env.NEXT_PUBLIC_APP_LINK_URL),
} as const;
