import { isGuestSecret } from '@/utils/guest-secret';
import { isCartLine, type CartLine } from '@/utils/guest-cart';
import type { GuestPaidItem } from '@/types/guest-checkout';

const PREFIX = 'vendit_guest_';
const PENDING_PREFIX = `${PREFIX}pending:`;
const PAYMENT_PREFIX = `${PREFIX}payment:`;
const DISPENSE_PREFIX = `${PREFIX}dispense:`;
const CART_PREFIX = `${PREFIX}cart:`;
const DAY_MS = 24 * 60 * 60 * 1000;
// A pending secret replays its payment, so a repeat purchase of the same basket must not inherit an old one.
const PENDING_TTL_MS = 60 * 60 * 1000;
// A cart outlives a visit to the machine only briefly; stock and prices move.
const CART_TTL_MS = 3 * 60 * 60 * 1000;

export interface GuestPaymentRecord {
  secret: string;
  paymentId: string;
  payUrl: string;
  basketKey: string;
  orderReference: string | null;
  machineId?: string;
  items?: GuestPaidItem[];
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

function optionalText(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function toPaidItem(value: unknown): GuestPaidItem | null {
  if (!isRecord(value) || !isCartLine(value)) return null;
  const unitPrice = typeof value.unitPrice === 'number' && Number.isFinite(value.unitPrice) ? value.unitPrice : 0;
  return {
    productId: value.productId,
    quantity: value.quantity,
    name: optionalText(value.name),
    imageUrl: optionalText(value.imageUrl),
    unitPrice,
  };
}

function paidItems(value: unknown): GuestPaidItem[] | null {
  if (!Array.isArray(value)) return null;
  return value.map(toPaidItem).filter((item): item is GuestPaidItem => item !== null);
}

function toPaymentRecord(entry: Entry | null): GuestPaymentRecord | null {
  if (!entry || !isGuestSecret(entry.secret)) return null;
  const { paymentId, payUrl, basketKey, orderReference, machineId } = entry;
  if (typeof paymentId !== 'string' || typeof payUrl !== 'string' || typeof basketKey !== 'string') {
    return null;
  }
  const items = paidItems(entry.items);
  return {
    secret: entry.secret,
    paymentId,
    payUrl,
    basketKey,
    orderReference: optionalText(orderReference),
    ...(typeof machineId === 'string' ? { machineId } : {}),
    ...(items ? { items } : {}),
    createdAt: entry.createdAt,
  };
}

function ttlFor(key: string): number {
  if (key.startsWith(PENDING_PREFIX)) return PENDING_TTL_MS;
  return key.startsWith(CART_PREFIX) ? CART_TTL_MS : DAY_MS;
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

  getCart(machineId: string): CartLine[] {
    const lines = readEntry(CART_PREFIX + machineId, CART_TTL_MS)?.lines;
    return Array.isArray(lines) ? lines.filter(isCartLine) : [];
  },

  saveCart(machineId: string, lines: CartLine[]): void {
    if (lines.length === 0) removeEntry(CART_PREFIX + machineId);
    else writeEntry(CART_PREFIX + machineId, { lines });
  },

  sweepExpired(): void {
    const keys = safely(
      (store) => Array.from({ length: store.length }, (_, index) => store.key(index)),
      [],
    ).filter((key): key is string => key !== null && key.startsWith(PREFIX));
    keys.forEach((key) => readEntry(key, ttlFor(key)));
  },
};
