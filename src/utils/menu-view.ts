import type { CartLine } from '@/utils/guest-cart';
import type { GuestMenuCategory, GuestMenuProduct } from '@/types/guest-menu';

export type BadgeKind = 'sold_out' | 'exclusive' | 'offer';

export type HealthLevel = 'very' | 'moderate' | 'less';

export type AddButtonMode = 'add' | 'sold_out' | 'claim';

export function isSoldOut(product: GuestMenuProduct): boolean {
  return product.available <= 0;
}

// First match wins, as in the app; the backend sends no sponsor type, so a sponsored card is a plain "Offer".
export function badgeFor(product: GuestMenuProduct): BadgeKind | null {
  if (isSoldOut(product)) return 'sold_out';
  if (product.saleType === 'exclusive') return 'exclusive';
  if (product.saleType === 'sponsored') return 'offer';
  return null;
}

export function addButtonMode(product: GuestMenuProduct): AddButtonMode {
  if (isSoldOut(product)) return 'sold_out';
  return product.guestBuyable ? 'add' : 'claim';
}

export function healthLevel(rating: number | null): HealthLevel | null {
  if (rating === null || rating <= 0) return null;
  if (rating >= 3) return 'very';
  return rating >= 2 ? 'moderate' : 'less';
}

export function starCount(rating: number | null): number {
  if (rating === null || !Number.isFinite(rating)) return 0;
  return Math.min(5, Math.max(0, Math.round(rating)));
}

export function sentenceCase(text: string): string {
  return text.length > 0 ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

export function wholeShelfId(categories: GuestMenuCategory[]): string | null {
  return categories[0]?.id ?? null;
}

export interface ShelfFilter {
  categoryId: string | null;
  wholeShelfId: string | null;
  query: string;
}

function matchesQuery(product: GuestMenuProduct, query: string): boolean {
  const needle = query.toLowerCase();
  return [product.name, product.brand].some((field) => field?.toLowerCase().includes(needle) ?? false);
}

// The first chip is the whole shelf; a search looks across every category.
export function visibleProducts(products: GuestMenuProduct[], filter: ShelfFilter): GuestMenuProduct[] {
  const query = filter.query.trim();
  if (query) return products.filter((product) => matchesQuery(product, query));
  if (filter.categoryId === null || filter.categoryId === filter.wholeShelfId) return products;
  return products.filter((product) => product.categoryId === filter.categoryId);
}

// Units a guest can take of one product: every ordinary card of it counts.
export function stockOf(products: GuestMenuProduct[], productId: string): number {
  return products
    .filter((product) => product.productId === productId && product.guestBuyable)
    .reduce((total, product) => total + product.available, 0);
}

// The buyable card a cart line is priced and pictured from.
export function cardFor(products: GuestMenuProduct[], productId: string): GuestMenuProduct | null {
  return products.find((product) => product.productId === productId && product.guestBuyable) ?? null;
}

// Lines the shopper cannot buy here (gone from the shelf, or now an app offer) drop out of the cart.
export function buyableLines(lines: CartLine[], products: GuestMenuProduct[]): CartLine[] {
  return lines.filter((line) => cardFor(products, line.productId) !== null);
}

// A card is itself a button: only a key aimed at the card opens it, never one bubbling from its own buttons.
export function opensCard(key: string, aimedAtCard: boolean): boolean {
  return aimedAtCard && (key === 'Enter' || key === ' ');
}
