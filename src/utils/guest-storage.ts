import { isGuestSecret } from '@/utils/guest-secret';

const PREFIX = 'vendit_guest_';
const PENDING_PREFIX = `${PREFIX}pending:`;
const PAYMENT_PREFIX = `${PREFIX}payment:`;
const DISPENSE_PREFIX = `${PREFIX}dispense:`;
const DAY_MS = 24 * 60 * 60 * 1000;
// A pending secret replays its payment, so a repeat purchase of the same basket must not inherit an old one.
const PENDING_TTL_MS = 60 * 60 * 1000;

export interface GuestPaymentRecord {
  secret: string;
  paymentId: string;
  payUrl: string;
  basketKey: string;
  orderReference: string | null;
  createdAt: number;
}

type Entry = Record<string, unknown> & { createdAt: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safely<T>(action: (store: Storage) => T, fallback: T): T {
  try {
    return action(window.localStorage);
  } catch {
    // Private mode, blocked storage or no window: the flow continues without persistence.
    return fallback;
  }
}

function readEntry(key: string, ttlMs: number): Entry | null {
  return safely((store) => {
    const raw = store.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isRecord(parsed) && typeof parsed.createdAt === 'number' && Date.now() - parsed.createdAt <= ttlMs) {
      return { ...parsed, createdAt: parsed.createdAt };
    }
    store.removeItem(key);
    return null;
  }, null);
}

function writeEntry(key: string, value: Record<string, unknown>): void {
  safely((store) => store.setItem(key, JSON.stringify({ ...value, createdAt: Date.now() })), undefined);
}

function removeEntry(key: string): void {
  safely((store) => store.removeItem(key), undefined);
}

function toPaymentRecord(entry: Entry | null): GuestPaymentRecord | null {
  if (!entry || !isGuestSecret(entry.secret)) return null;
  const { paymentId, payUrl, basketKey, orderReference } = entry;
  if (typeof paymentId !== 'string' || typeof payUrl !== 'string' || typeof basketKey !== 'string') {
    return null;
  }
  return {
    secret: entry.secret,
    paymentId,
    payUrl,
    basketKey,
    orderReference: typeof orderReference === 'string' ? orderReference : null,
    createdAt: entry.createdAt,
  };
}

function ttlFor(key: string): number {
  return key.startsWith(PENDING_PREFIX) ? PENDING_TTL_MS : DAY_MS;
}

export const guestStorage = {
  getPendingSecret(basketKey: string): string | null {
    const secret = readEntry(PENDING_PREFIX + basketKey, PENDING_TTL_MS)?.secret;
    return isGuestSecret(secret) ? secret : null;
  },

  savePendingSecret(basketKey: string, secret: string): void {
    writeEntry(PENDING_PREFIX + basketKey, { secret });
  },

  clearPendingSecret(basketKey: string): void {
    removeEntry(PENDING_PREFIX + basketKey);
  },

  savePayment(record: Omit<GuestPaymentRecord, 'createdAt'>): void {
    writeEntry(PAYMENT_PREFIX + record.paymentId, { ...record });
  },

  getPayment(paymentId: string): GuestPaymentRecord | null {
    return toPaymentRecord(readEntry(PAYMENT_PREFIX + paymentId, DAY_MS));
  },

  dispenseRequestedWithin(paymentId: string, windowMs: number): boolean {
    return readEntry(DISPENSE_PREFIX + paymentId, windowMs) !== null;
  },

  markDispenseRequested(paymentId: string): void {
    writeEntry(DISPENSE_PREFIX + paymentId, {});
  },

  sweepExpired(): void {
    const keys = safely(
      (store) => Array.from({ length: store.length }, (_, index) => store.key(index)),
      [],
    ).filter((key): key is string => key !== null && key.startsWith(PREFIX));
    keys.forEach((key) => readEntry(key, ttlFor(key)));
  },
};
