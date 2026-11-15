import { describe, expect, it } from 'vitest';
import { platformOf, storeUrlFor } from './app-store';

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

describe('storeUrlFor', () => {
  it('sends an iPhone to the App Store and an Android phone to Google Play', () => {
    expect(storeUrlFor('ios', URLS)).toBe(URLS.ios);
    expect(storeUrlFor('android', URLS)).toBe(URLS.android);
  });

  it('sends a desktop to the App Store', () => {
    expect(storeUrlFor('other', URLS)).toBe(URLS.ios);
  });

  it('falls back to whichever store is configured', () => {
    expect(storeUrlFor('ios', { ios: null, android: URLS.android })).toBe(URLS.android);
    expect(storeUrlFor('android', { ios: URLS.ios, android: null })).toBe(URLS.ios);
    expect(storeUrlFor('other', { ios: null, android: null })).toBeNull();
  });
});
