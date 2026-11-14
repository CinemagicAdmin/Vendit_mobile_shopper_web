import { describe, expect, it } from 'vitest';
import { generateGuestSecret, isGuestSecret, toBase64Url } from '@/utils/guest-secret';
import { formatMoney, roundMoney } from '@/utils/money';

describe('generateGuestSecret', () => {
  it('produces 43 base64url characters without padding', () => {
    for (let i = 0; i < 50; i += 1) {
      const secret = generateGuestSecret();
      expect(secret).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(isGuestSecret(secret)).toBe(true);
    }
  });

  it('does not repeat', () => {
    const secrets = new Set(Array.from({ length: 100 }, generateGuestSecret));
    expect(secrets.size).toBe(100);
  });
});

describe('toBase64Url', () => {
  it('uses the url-safe alphabet and drops padding', () => {
    expect(toBase64Url(new Uint8Array([0xfb, 0xff]))).toBe('-_8');
    expect(toBase64Url(new Uint8Array([0, 0, 0]))).toBe('AAAA');
  });
});

describe('isGuestSecret', () => {
  it('rejects anything but a 43 character base64url string', () => {
    expect(isGuestSecret('a'.repeat(42))).toBe(false);
    expect(isGuestSecret('a'.repeat(44))).toBe(false);
    expect(isGuestSecret(`${'a'.repeat(42)}=`)).toBe(false);
    expect(isGuestSecret(`${'a'.repeat(42)}+`)).toBe(false);
    expect(isGuestSecret(42)).toBe(false);
  });
});

describe('money', () => {
  it('formats to three decimals and strips float noise', () => {
    expect(formatMoney(0.1 + 0.2, 'KWD')).toBe('KWD 0.300');
    expect(formatMoney(1, 'KWD')).toBe('KWD 1.000');
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(1.2346)).toBe(1.235);
  });
});
