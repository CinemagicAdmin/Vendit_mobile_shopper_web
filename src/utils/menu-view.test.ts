import { describe, expect, it } from 'vitest';
import {
  addButtonMode,
  badgeFor,
  buyableLines,
  healthLevel,
  opensCard,
  sentenceCase,
  starCount,
  stockOf,
  visibleProducts,
  wholeShelfId,
} from '@/utils/menu-view';
import type { GuestMenuProduct } from '@/types/guest-menu';

function product(patch: Partial<GuestMenuProduct>): GuestMenuProduct {
  return {
    key: patch.productId ?? 'p',
    productId: 'p',
    name: 'Water',
    brand: null,
    description: null,
    imageUrl: null,
    categoryId: 'drinks',
    price: 0.15,
    available: 5,
    saleType: 'normal',
    healthRating: 4,
    guestBuyable: true,
    ...patch,
  };
}

describe('badgeFor', () => {
  it('puts sold out ahead of everything', () => {
    expect(badgeFor(product({ available: 0, saleType: 'exclusive' }))).toBe('sold_out');
  });

  it('marks exclusive and sponsored cards, and nothing on a plain one', () => {
    expect(badgeFor(product({ saleType: 'exclusive', guestBuyable: false }))).toBe('exclusive');
    expect(badgeFor(product({ saleType: 'sponsored', guestBuyable: false }))).toBe('offer');
    expect(badgeFor(product({}))).toBeNull();
  });

  it('picks the add button look', () => {
    expect(addButtonMode(product({}))).toBe('add');
    expect(addButtonMode(product({ available: 0, guestBuyable: false }))).toBe('sold_out');
    expect(addButtonMode(product({ saleType: 'sponsored', guestBuyable: false }))).toBe('claim');
  });
});

describe('health', () => {
  it('follows the app thresholds', () => {
    expect(healthLevel(null)).toBeNull();
    expect(healthLevel(0)).toBeNull();
    expect(healthLevel(1.5)).toBe('less');
    expect(healthLevel(2)).toBe('moderate');
    expect(healthLevel(3)).toBe('very');
    expect(starCount(4.6)).toBe(5);
    expect(starCount(null)).toBe(0);
  });
});

describe('visibleProducts', () => {
  const shelf = [
    product({ key: 'w', productId: 'w', name: 'Water', categoryId: 'drinks' }),
    product({ key: 'c', productId: 'c', name: 'Chips', brand: 'Lays', categoryId: 'snacks' }),
  ];
  const all = { wholeShelfId: 'all', query: '' };

  it('shows the whole shelf on the first chip and filters the others', () => {
    expect(visibleProducts(shelf, { ...all, categoryId: null })).toHaveLength(2);
    expect(visibleProducts(shelf, { ...all, categoryId: 'all' })).toHaveLength(2);
    expect(visibleProducts(shelf, { ...all, categoryId: 'snacks' }).map((p) => p.key)).toEqual(['c']);
  });

  it('searches name and brand across categories', () => {
    expect(visibleProducts(shelf, { ...all, categoryId: 'drinks', query: 'lay' }).map((p) => p.key)).toEqual(['c']);
    expect(visibleProducts(shelf, { ...all, categoryId: null, query: '  WAT ' }).map((p) => p.key)).toEqual(['w']);
    expect(visibleProducts(shelf, { ...all, categoryId: null, query: 'tea' })).toEqual([]);
  });

  it('takes the first category as the whole shelf', () => {
    expect(wholeShelfId([{ id: 'all', name: 'All' }, { id: 'x', name: 'x' }])).toBe('all');
    expect(wholeShelfId([])).toBeNull();
    expect(sentenceCase('drinks')).toBe('Drinks');
  });
});

describe('stock and cart lines', () => {
  const shelf = [
    product({ key: 'a1', productId: 'a', available: 3 }),
    product({ key: 'a2', productId: 'a', available: 2 }),
    product({ key: 'a3', productId: 'a', available: 4, saleType: 'sponsored', guestBuyable: false }),
  ];

  it('adds every ordinary card of a product and skips offers', () => {
    expect(stockOf(shelf, 'a')).toBe(5);
    expect(stockOf(shelf, 'missing')).toBe(0);
  });

  it('drops cart lines the guest cannot buy here', () => {
    expect(buyableLines([{ productId: 'a', quantity: 1 }, { productId: 'gone', quantity: 2 }], shelf)).toEqual([
      { productId: 'a', quantity: 1 },
    ]);
  });
});

describe('opensCard', () => {
  it('opens on Enter or Space aimed at the card', () => {
    expect(opensCard('Enter', true)).toBe(true);
    expect(opensCard(' ', true)).toBe(true);
  });

  it('ignores keys bubbling from the add or info button, and other keys', () => {
    expect(opensCard('Enter', false)).toBe(false);
    expect(opensCard(' ', false)).toBe(false);
    expect(opensCard('Tab', true)).toBe(false);
  });
});
