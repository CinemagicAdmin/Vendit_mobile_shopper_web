import { describe, expect, it } from 'vitest';
import { platformOf, storeLinksFor } from './app-store';

const URLS = { ios: 'https://apps.apple.com/app/id1', android: 'https://play.google.com/store/apps/details?id=x' };

const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15';

describe('platformOf', () => {
  it.each([
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148', 'ios'],
    ['Mozilla/5.0 (Linux; Android 15; Pixel 9) Chrome/131.0 Mobile Safari/537.36', 'android'],
    [MAC, 'other'],
    ['', 'other'],
  ])('reads %s as %s', (userAgent, platform) => {
    expect(platformOf(userAgent)).toBe(platform);
  });

  it('reads an iPad, which reports a Mac, from its touch screen', () => {
    expect(platformOf(MAC, 5)).toBe('ios');
    expect(platformOf(MAC, 0)).toBe('other');
  });
});

describe('storeLinksFor', () => {
  it('gives an iPhone only the App Store, and an Android phone only Google Play', () => {
    expect(storeLinksFor('ios', URLS)).toEqual([
      { store: 'ios', label: 'Download on the App Store', href: URLS.ios },
    ]);
    expect(storeLinksFor('android', URLS)).toEqual([
      { store: 'android', label: 'Get it on Google Play', href: URLS.android },
    ]);
  });

  it('gives anything else both stores', () => {
    expect(storeLinksFor('other', URLS).map((link) => link.label)).toEqual(['App Store', 'Google Play']);
  });

  it('falls back to whatever store is configured', () => {
    expect(storeLinksFor('ios', { ios: null, android: URLS.android }).map((l) => l.store)).toEqual(['android']);
    expect(storeLinksFor('other', { ios: null, android: null })).toEqual([]);
  });
});
