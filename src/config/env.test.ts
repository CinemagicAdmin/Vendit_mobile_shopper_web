import { afterEach, describe, expect, it, vi } from 'vitest';

async function configWith(env: Record<string, string>) {
  Object.entries(env).forEach(([name, value]) => vi.stubEnv(name, value));
  vi.resetModules();
  return (await import('@/config/env')).config;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('appLinkUrl', () => {
  it('defaults to the Vend IT machine link', async () => {
    expect((await configWith({ NEXT_PUBLIC_APP_LINK_URL: '' })).appLinkUrl).toBe('https://invite.tryvendit.com/machine');
  });

  it('is disabled by the value off', async () => {
    expect((await configWith({ NEXT_PUBLIC_APP_LINK_URL: 'off' })).appLinkUrl).toBeNull();
  });

  it('accepts a Branch app.link host, which store URLs still refuse', async () => {
    const config = await configWith({
      NEXT_PUBLIC_APP_LINK_URL: 'https://vendit.app.link/machine',
      NEXT_PUBLIC_IOS_STORE_URL: 'https://vendit.app.link/ios',
    });
    expect(config.appLinkUrl).toBe('https://vendit.app.link/machine');
    expect(config.iosStoreUrl).toBeNull();
  });

  it('refuses anything that is not an https URL', async () => {
    expect((await configWith({ NEXT_PUBLIC_APP_LINK_URL: 'http://invite.tryvendit.com/machine' })).appLinkUrl).toBeNull();
    expect((await configWith({ NEXT_PUBLIC_APP_LINK_URL: 'not a url' })).appLinkUrl).toBeNull();
  });
});
