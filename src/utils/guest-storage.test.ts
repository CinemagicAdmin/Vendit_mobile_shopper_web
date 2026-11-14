import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { guestStorage } from '@/utils/guest-storage';

class MemoryStorage {
  private items = new Map<string, string>();
  get length() {
    return this.items.size;
  }
  key(index: number) {
    return Array.from(this.items.keys())[index] ?? null;
  }
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.items.set(key, value);
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
}

const SECRET = 'A'.repeat(43);
const HOUR = 60 * 60 * 1000;
const record = {
  secret: SECRET,
  paymentId: 'pay-1',
  payUrl: '/pay?m=M&p=a&q=1',
  basketKey: 'basket',
  orderReference: 'VND-1',
};

let store: MemoryStorage;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-14T10:00:00Z'));
  store = new MemoryStorage();
  vi.stubGlobal('window', { localStorage: store });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('guestStorage', () => {
  it('stores pending secrets under the vendit_guest_ prefix', () => {
    guestStorage.savePendingSecret('basket', SECRET);
    expect(guestStorage.getPendingSecret('basket')).toBe(SECRET);
    expect(store.key(0)?.startsWith('vendit_guest_')).toBe(true);
    guestStorage.clearPendingSecret('basket');
    expect(guestStorage.getPendingSecret('basket')).toBeNull();
  });

  it('drops a pending secret after an hour', () => {
    guestStorage.savePendingSecret('basket', SECRET);
    vi.advanceTimersByTime(HOUR + 1);
    expect(guestStorage.getPendingSecret('basket')).toBeNull();
    expect(store.length).toBe(0);
  });

  it('ignores a malformed pending secret', () => {
    guestStorage.savePendingSecret('basket', 'short');
    expect(guestStorage.getPendingSecret('basket')).toBeNull();
  });

  it('round-trips a payment record and expires it after 24 h', () => {
    guestStorage.savePayment(record);
    expect(guestStorage.getPayment('pay-1')).toEqual({ ...record, createdAt: Date.now() });
    vi.advanceTimersByTime(24 * HOUR + 1);
    expect(guestStorage.getPayment('pay-1')).toBeNull();
  });

  it('treats corrupt JSON as missing', () => {
    store.setItem('vendit_guest_payment:pay-1', '{not json');
    expect(guestStorage.getPayment('pay-1')).toBeNull();
  });

  it('tracks a dispense request inside its window only', () => {
    expect(guestStorage.dispenseRequestedWithin('pay-1', 60_000)).toBe(false);
    guestStorage.markDispenseRequested('pay-1');
    expect(guestStorage.dispenseRequestedWithin('pay-1', 60_000)).toBe(true);
    vi.advanceTimersByTime(60_001);
    expect(guestStorage.dispenseRequestedWithin('pay-1', 60_000)).toBe(false);
  });

  it('sweeps expired guest entries and leaves other keys alone', () => {
    store.setItem('vendit_access_token', 'token');
    guestStorage.savePendingSecret('old', SECRET);
    guestStorage.savePayment(record);
    vi.advanceTimersByTime(2 * HOUR);
    guestStorage.savePendingSecret('fresh', SECRET);
    guestStorage.sweepExpired();
    expect(guestStorage.getPendingSecret('old')).toBeNull();
    expect(guestStorage.getPendingSecret('fresh')).toBe(SECRET);
    expect(guestStorage.getPayment('pay-1')).not.toBeNull();
    expect(store.getItem('vendit_access_token')).toBe('token');
  });

  it('keeps working when storage throws', () => {
    vi.stubGlobal('window', {
      get localStorage(): Storage {
        throw new Error('SecurityError');
      },
    });
    expect(() => guestStorage.savePendingSecret('basket', SECRET)).not.toThrow();
    expect(guestStorage.getPendingSecret('basket')).toBeNull();
    expect(() => guestStorage.sweepExpired()).not.toThrow();
  });
});
