import type { GuestBasketLine } from '@/types/guest-checkout';

// The app's dispense ceilings (lib/config/dispense_limits.dart); the API refuses bigger orders after payment.
export const MAX_DIFFERENT_ITEMS = 15;
export const MAX_PER_ITEM = 10;
export const MAX_ORDER_UNITS = 15;

export type CartLine = GuestBasketLine;

export type CartBlock = 'stock' | 'slots' | 'item_quantity' | 'order_quantity';

export type CartChange = { ok: true; lines: CartLine[] } | { ok: false; message: string };

export function unitsOf(lines: CartLine[], productId: string): number {
  return lines.find((line) => line.productId === productId)?.quantity ?? 0;
}

export function totalUnits(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

export function blockMessage(block: CartBlock, stock: number): string {
  if (block === 'slots') return `Up to ${MAX_DIFFERENT_ITEMS} different items per order`;
  if (block === 'item_quantity') return `Up to ${MAX_PER_ITEM} of one item per order`;
  if (block === 'order_quantity') return `Up to ${MAX_ORDER_UNITS} items per order`;
  return stock > 0 ? `Only ${Math.trunc(stock)} left in stock` : 'Out of stock';
}

export function orderLimit(lines: CartLine[], productId: string): CartBlock | null {
  const units = unitsOf(lines, productId);
  if (units === 0 && lines.length >= MAX_DIFFERENT_ITEMS) return 'slots';
  if (units >= MAX_PER_ITEM) return 'item_quantity';
  if (totalUnits(lines) >= MAX_ORDER_UNITS) return 'order_quantity';
  return null;
}

export function withQuantity(lines: CartLine[], productId: string, quantity: number): CartLine[] {
  if (quantity <= 0) return lines.filter((line) => line.productId !== productId);
  if (unitsOf(lines, productId) === 0) return [...lines, { productId, quantity }];
  return lines.map((line) => (line.productId === productId ? { productId, quantity } : line));
}

// Tile and cart-line plus: the order ceilings first, then stock, as the app checks them.
export function addOne(lines: CartLine[], productId: string, stock: number): CartChange {
  const limit = orderLimit(lines, productId);
  if (limit) return { ok: false, message: blockMessage(limit, stock) };
  const next = unitsOf(lines, productId) + 1;
  if (stock <= 0 || next > stock) return { ok: false, message: blockMessage('stock', stock) };
  return { ok: true, lines: withQuantity(lines, productId, next) };
}

export function removeOne(lines: CartLine[], productId: string): CartLine[] {
  return withQuantity(lines, productId, unitsOf(lines, productId) - 1);
}

// The product page stepper: may it show `quantity` of this product, given everything else in the cart.
export function stepperBlock(lines: CartLine[], productId: string, quantity: number, stock: number): CartBlock | null {
  if (quantity > stock) return 'stock';
  if (quantity > MAX_PER_ITEM) return 'item_quantity';
  const others = totalUnits(lines) - unitsOf(lines, productId);
  if (others + quantity > MAX_ORDER_UNITS) return 'order_quantity';
  return null;
}

// Buy now resizes a line already in the cart; a new line still has to fit the item count.
export function buyNow(lines: CartLine[], productId: string, quantity: number): CartChange {
  const limit = unitsOf(lines, productId) === 0 ? orderLimit(lines, productId) : null;
  if (limit) return { ok: false, message: blockMessage(limit, 0) };
  return { ok: true, lines: withQuantity(lines, productId, quantity) };
}

export function sameLines(a: CartLine[], b: CartLine[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((line) => unitsOf(b, line.productId) === line.quantity);
}

export function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== 'object' || value === null) return false;
  const { productId, quantity } = value as Record<string, unknown>;
  return (
    typeof productId === 'string' &&
    productId.length > 0 &&
    typeof quantity === 'number' &&
    Number.isInteger(quantity) &&
    quantity > 0
  );
}
