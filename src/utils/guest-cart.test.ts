import { describe, expect, it } from 'vitest';
import {
  addOne,
  blockMessage,
  buyNow,
  isCartLine,
  orderLimit,
  removeOne,
  sameLines,
  stepperBlock,
  totalUnits,
  type CartLine,
} from '@/utils/guest-cart';

const lines = (...pairs: Array<[string, number]>): CartLine[] =>
  pairs.map(([productId, quantity]) => ({ productId, quantity }));

const manyDistinct = (count: number) => lines(...Array.from({ length: count }, (_, i): [string, number] => [`p${i}`, 1]));

describe('addOne', () => {
  it('adds a new line, then grows it', () => {
    const first = addOne([], 'a', 5);
    expect(first).toEqual({ ok: true, lines: lines(['a', 1]) });
    if (!first.ok) return;
    expect(addOne(first.lines, 'a', 5)).toEqual({ ok: true, lines: lines(['a', 2]) });
  });

  it('stops at the stock with the app copy', () => {
    expect(addOne(lines(['a', 2]), 'a', 2)).toEqual({ ok: false, message: 'Only 2 left in stock' });
    expect(addOne([], 'a', 0)).toEqual({ ok: false, message: 'Out of stock' });
  });

  it('caps one item at 10', () => {
    expect(addOne(lines(['a', 10]), 'a', 50)).toEqual({ ok: false, message: 'Up to 10 of one item per order' });
  });

  it('caps the order at 15 units', () => {
    expect(addOne(lines(['a', 10], ['b', 5]), 'c', 9)).toEqual({ ok: false, message: 'Up to 15 items per order' });
  });

  it('caps the order at 15 different items before anything else', () => {
    expect(addOne(manyDistinct(15), 'new', 9)).toEqual({ ok: false, message: 'Up to 15 different items per order' });
    expect(orderLimit(manyDistinct(15), 'p0')).toBe('order_quantity');
  });
});

describe('removeOne', () => {
  it('shrinks a line and drops it at zero', () => {
    expect(removeOne(lines(['a', 2], ['b', 1]), 'a')).toEqual(lines(['a', 1], ['b', 1]));
    expect(removeOne(lines(['a', 1], ['b', 1]), 'a')).toEqual(lines(['b', 1]));
  });
});

describe('stepperBlock and buyNow', () => {
  it('checks stock, the per-item cap and the rest of the cart', () => {
    expect(stepperBlock([], 'a', 3, 2)).toBe('stock');
    expect(stepperBlock([], 'a', 11, 50)).toBe('item_quantity');
    expect(stepperBlock(lines(['b', 10], ['a', 2]), 'a', 6, 50)).toBe('order_quantity');
    expect(stepperBlock(lines(['b', 10], ['a', 2]), 'a', 5, 50)).toBeNull();
  });

  it('resizes an existing line and refuses a sixteenth item', () => {
    expect(buyNow(lines(['a', 1]), 'a', 4)).toEqual({ ok: true, lines: lines(['a', 4]) });
    expect(buyNow(manyDistinct(15), 'new', 1)).toEqual({ ok: false, message: 'Up to 15 different items per order' });
  });
});

describe('helpers', () => {
  it('counts units and compares lines regardless of order', () => {
    expect(totalUnits(lines(['a', 2], ['b', 3]))).toBe(5);
    expect(sameLines(lines(['a', 2], ['b', 3]), lines(['b', 3], ['a', 2]))).toBe(true);
    expect(sameLines(lines(['a', 2]), lines(['a', 3]))).toBe(false);
  });

  it('validates stored lines', () => {
    expect(isCartLine({ productId: 'a', quantity: 2 })).toBe(true);
    expect(isCartLine({ productId: '', quantity: 2 })).toBe(false);
    expect(isCartLine({ productId: 'a', quantity: 1.5 })).toBe(false);
    expect(isCartLine(null)).toBe(false);
  });

  it('words every block', () => {
    expect(blockMessage('stock', 1)).toBe('Only 1 left in stock');
    expect(blockMessage('slots', 0)).toBe('Up to 15 different items per order');
  });
});
