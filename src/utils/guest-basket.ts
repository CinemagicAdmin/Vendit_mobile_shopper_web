import type { GuestBasket, GuestBasketLine } from '@/types/guest-checkout';

export const MAX_LINES = 30;
export const MAX_UNITS = 20;
const MAX_ID_LENGTH = 64;
const QUANTITY_PATTERN = /^\d{1,2}$/;

export interface GuestBasketQuery {
  m: string | null;
  p: string | null;
  q: string | null;
}

export type GuestBasketError =
  | 'MISSING_MACHINE'
  | 'MISSING_ITEMS'
  | 'MISMATCHED_LISTS'
  | 'TOO_MANY_LINES'
  | 'BAD_PRODUCT'
  | 'BAD_QUANTITY'
  | 'TOO_MANY_UNITS';

export type GuestBasketParse =
  | { ok: true; basket: GuestBasket }
  | { ok: false; error: GuestBasketError };

function isId(value: string): boolean {
  return value.length >= 1 && value.length <= MAX_ID_LENGTH;
}

function splitList(value: string | null): string[] | null {
  if (!value) return null;
  return value.split(',').map((part) => part.trim());
}

function parseQuantities(raw: string[]): number[] | null {
  const quantities: number[] = [];
  for (const part of raw) {
    if (!QUANTITY_PATTERN.test(part)) return null;
    const quantity = Number(part);
    if (quantity < 1 || quantity > MAX_UNITS) return null;
    quantities.push(quantity);
  }
  return quantities;
}

function mergeLines(productIds: string[], quantities: number[]): GuestBasketLine[] {
  const merged = new Map<string, number>();
  productIds.forEach((productId, index) => {
    merged.set(productId, (merged.get(productId) ?? 0) + quantities[index]);
  });
  return Array.from(merged, ([productId, quantity]) => ({ productId, quantity }));
}

export function guestBasketKey(machineId: string, lines: GuestBasketLine[]): string {
  const pairs = lines
    .map((line): [string, number] => [line.productId, line.quantity])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return JSON.stringify([machineId, pairs]);
}

export function parseGuestBasket(query: GuestBasketQuery): GuestBasketParse {
  const machineId = query.m?.trim() ?? '';
  if (!isId(machineId)) return { ok: false, error: 'MISSING_MACHINE' };

  const productIds = splitList(query.p);
  const rawQuantities = splitList(query.q);
  if (!productIds || !rawQuantities) return { ok: false, error: 'MISSING_ITEMS' };
  if (productIds.length !== rawQuantities.length) return { ok: false, error: 'MISMATCHED_LISTS' };
  if (productIds.length > MAX_LINES) return { ok: false, error: 'TOO_MANY_LINES' };
  if (!productIds.every(isId)) return { ok: false, error: 'BAD_PRODUCT' };

  const quantities = parseQuantities(rawQuantities);
  if (!quantities) return { ok: false, error: 'BAD_QUANTITY' };

  const lines = mergeLines(productIds, quantities);
  if (lines.some((line) => line.quantity > MAX_UNITS)) return { ok: false, error: 'TOO_MANY_UNITS' };

  return { ok: true, basket: { machineId, lines, key: guestBasketKey(machineId, lines) } };
}
