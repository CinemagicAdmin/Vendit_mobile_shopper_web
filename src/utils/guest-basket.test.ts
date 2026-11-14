import { describe, expect, it } from 'vitest';
import { guestBasketKey, parseGuestBasket } from '@/utils/guest-basket';

const query = (m: string | null, p: string | null, q: string | null) => parseGuestBasket({ m, p, q });

describe('parseGuestBasket', () => {
  it('parses a basket and keeps first-seen order', () => {
    const result = query('M-1', 'b,a', '2,1');
    expect(result).toEqual({
      ok: true,
      basket: {
        machineId: 'M-1',
        lines: [
          { productId: 'b', quantity: 2 },
          { productId: 'a', quantity: 1 },
        ],
        key: guestBasketKey('M-1', [
          { productId: 'a', quantity: 1 },
          { productId: 'b', quantity: 2 },
        ]),
      },
    });
  });

  it('merges duplicate product ids by summing quantities', () => {
    const result = query('M-1', 'a,b,a', '1,2,3');
    expect(result.ok && result.basket.lines).toEqual([
      { productId: 'a', quantity: 4 },
      { productId: 'b', quantity: 2 },
    ]);
  });

  it('trims whitespace around machine id and list entries', () => {
    const result = query(' M-1 ', ' a , b ', ' 1 , 2 ');
    expect(result.ok && result.basket.machineId).toBe('M-1');
    expect(result.ok && result.basket.lines.map((line) => line.productId)).toEqual(['a', 'b']);
  });

  it.each([
    [null, 'a', '1', 'MISSING_MACHINE'],
    ['  ', 'a', '1', 'MISSING_MACHINE'],
    ['x'.repeat(65), 'a', '1', 'MISSING_MACHINE'],
    ['M', null, '1', 'MISSING_ITEMS'],
    ['M', 'a', '', 'MISSING_ITEMS'],
    ['M', 'a,b', '1', 'MISMATCHED_LISTS'],
    ['M', 'a,,b', '1,1,1', 'BAD_PRODUCT'],
    ['M', 'a,' + 'y'.repeat(65), '1,1', 'BAD_PRODUCT'],
    ['M', 'a', '0', 'BAD_QUANTITY'],
    ['M', 'a', '21', 'BAD_QUANTITY'],
    ['M', 'a', '1.5', 'BAD_QUANTITY'],
    ['M', 'a', '-1', 'BAD_QUANTITY'],
    ['M', 'a', 'abc', 'BAD_QUANTITY'],
    ['M', 'a,a', '15,10', 'TOO_MANY_UNITS'],
  ])('rejects m=%s p=%s q=%s with %s', (m, p, q, error) => {
    expect(query(m, p, q)).toEqual({ ok: false, error });
  });

  it('accepts 30 lines and rejects 31', () => {
    const ids = (n: number) => Array.from({ length: n }, (_, index) => `p${index}`).join(',');
    const ones = (n: number) => Array.from({ length: n }, () => '1').join(',');
    expect(query('M', ids(30), ones(30)).ok).toBe(true);
    expect(query('M', ids(31), ones(31))).toEqual({ ok: false, error: 'TOO_MANY_LINES' });
  });

  it('accepts the maximum of 20 units for one product', () => {
    expect(query('M', 'a,a', '10,10').ok).toBe(true);
  });
});

describe('guestBasketKey', () => {
  it('ignores line order but not quantities or machine', () => {
    const ab = guestBasketKey('M', [
      { productId: 'a', quantity: 1 },
      { productId: 'b', quantity: 2 },
    ]);
    const ba = guestBasketKey('M', [
      { productId: 'b', quantity: 2 },
      { productId: 'a', quantity: 1 },
    ]);
    expect(ab).toBe(ba);
    expect(guestBasketKey('M', [{ productId: 'a', quantity: 2 }])).not.toBe(
      guestBasketKey('M', [{ productId: 'a', quantity: 1 }]),
    );
    expect(guestBasketKey('N', [{ productId: 'a', quantity: 1 }])).not.toBe(
      guestBasketKey('M', [{ productId: 'a', quantity: 1 }]),
    );
  });
});
