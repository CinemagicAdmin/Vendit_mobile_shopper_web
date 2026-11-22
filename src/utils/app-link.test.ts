import { describe, expect, it } from 'vitest';
import { appLinkFor, usesAppLink, type AppClick } from '@/utils/app-link';

const LINKS = {
  appLink: 'https://invite.tryvendit.com/machine',
  ios: 'https://apps.apple.com/app/id1',
  android: 'https://play.google.com/store/apps/details?id=x',
};
const CLICK_ID = 'AbCdEfGhIjKlMnOpQrSt_-';

const click = (overrides: Partial<AppClick> = {}): AppClick => ({
  machineId: 'VM-0042',
  place: 'checkout',
  clickId: CLICK_ID,
  platform: 'ios',
  ...overrides,
});

const paramsOf = (href: string | null) => Object.fromEntries(new URL(href ?? '').searchParams);

describe('appLinkFor', () => {
  it('sends an iPhone with a known machine through the Branch link with store overrides', () => {
    const href = appLinkFor(click(), LINKS);
    expect(href?.startsWith(`${LINKS.appLink}?`)).toBe(true);
    expect(paramsOf(href)).toEqual({
      m: 'VM-0042',
      src: 'web',
      wc: CLICK_ID,
      $ios_url: LINKS.ios,
      $android_url: LINKS.android,
      '~channel': 'shopper_web',
      '~feature': 'app_promo',
      '~campaign': 'checkout',
    });
    expect(usesAppLink(click(), LINKS)).toBe(true);
  });

  it('sends an Android phone through the same link', () => {
    expect(paramsOf(appLinkFor(click({ platform: 'android', place: 'app_only' }), LINKS))).toMatchObject({
      m: 'VM-0042',
      $android_url: LINKS.android,
      '~campaign': 'app_only',
    });
  });

  it('carries the click id it was given as wc, and no wc without one', () => {
    expect(paramsOf(appLinkFor(click({ clickId: 'Zz'.repeat(11) }), LINKS)).wc).toBe('Zz'.repeat(11));
    expect(paramsOf(appLinkFor(click({ clickId: null }), LINKS))).not.toHaveProperty('wc');
  });

  it('encodes every value, including the store URLs and the $ and ~ keys', () => {
    expect(appLinkFor(click(), LINKS)).toBe(
      'https://invite.tryvendit.com/machine?m=VM-0042&src=web&wc=AbCdEfGhIjKlMnOpQrSt_-' +
        '&%24ios_url=https%3A%2F%2Fapps.apple.com%2Fapp%2Fid1' +
        '&%24android_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dx' +
        '&%7Echannel=shopper_web&%7Efeature=app_promo&%7Ecampaign=checkout',
    );
  });

  it('gives a desktop the raw store page', () => {
    expect(appLinkFor(click({ platform: 'other' }), LINKS)).toBe(LINKS.ios);
    expect(usesAppLink(click({ platform: 'other' }), LINKS)).toBe(false);
  });

  it('gives the raw store page when the machine is unknown or malformed', () => {
    expect(appLinkFor(click({ machineId: undefined }), LINKS)).toBe(LINKS.ios);
    expect(appLinkFor(click({ machineId: null, platform: 'android' }), LINKS)).toBe(LINKS.android);
    expect(appLinkFor(click({ machineId: 'VM 42&x=1' }), LINKS)).toBe(LINKS.ios);
  });

  it('gives the raw store page when the Branch link is off or a store override is missing', () => {
    expect(appLinkFor(click(), { ...LINKS, appLink: null })).toBe(LINKS.ios);
    expect(appLinkFor(click({ platform: 'android' }), { ...LINKS, ios: null })).toBe(LINKS.android);
    expect(appLinkFor(click(), { appLink: LINKS.appLink, ios: null, android: null })).toBeNull();
  });

  it('uses the configured Branch link by default', () => {
    expect(appLinkFor(click())?.startsWith('https://invite.tryvendit.com/machine?m=VM-0042&')).toBe(true);
  });
});
