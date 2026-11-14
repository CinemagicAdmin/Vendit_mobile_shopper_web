import { describe, expect, it } from 'vitest';
import { parseGuestBasket } from '@/utils/guest-basket';
import {
  checkoutView,
  machineIdFromPayUrl,
  machineUrl,
  paidItems,
  payUrlFor,
  quoteMatches,
} from '@/utils/guest-cart-url';
import type { GuestQuote } from '@/types/guest-checkout';

const quote: GuestQuote = {
  machine: { id: 'M-1', name: 'Lobby', location: null, online: true },
  lines: [
    { productId: 'a', name: 'Water', imageUrl: null, unitPrice: 0.15, quantity: 2, lineTotal: 0.3, available: true },
    { productId: 'b', name: 'Chips', imageUrl: 'https://x/y.png', unitPrice: 0.25, quantity: 1, lineTotal: 0.25, available: true },
  ],
  total: 0.55,
  currency: 'KWD',
  sellable: true,
  unavailableReason: null,
  paymentMethods: ['ALL'],
};

describe('payUrlFor', () => {
  it('writes the kiosk link shape that /pay parses back', () => {
    const url = payUrlFor('M 1', [{ productId: 'a', quantity: 2 }, { productId: 'b', quantity: 1 }]);
    expect(url).toBe('/pay?m=M%201&p=a,b&q=2,1');
    const params = new URLSearchParams(url.slice('/pay?'.length));
    const parsed = parseGuestBasket({ m: params.get('m'), p: params.get('p'), q: params.get('q') });
    expect(parsed.ok && parsed.basket.lines).toEqual([
      { productId: 'a', quantity: 2 },
      { productId: 'b', quantity: 1 },
    ]);
  });

  it('links back to the machine page and reads the machine from a saved pay url', () => {
    expect(machineUrl('VENDIT_0046')).toBe('/machine?m=VENDIT_0046');
    expect(machineIdFromPayUrl('/pay?m=VENDIT_0046&p=a&q=1')).toBe('VENDIT_0046');
    expect(machineIdFromPayUrl('https://evil.example/pay?m=x')).toBeNull();
    expect(machineIdFromPayUrl(null)).toBeNull();
  });
});

describe('checkoutView', () => {
  it('uses the quote as is when it matches the basket', () => {
    const lines = [{ productId: 'b', quantity: 1 }, { productId: 'a', quantity: 2 }];
    expect(quoteMatches(quote, lines)).toBe(true);
    expect(checkoutView(quote, lines)).toEqual({ lines: quote.lines, total: 0.55, units: 3 });
  });

  it('reprices an edit from the last quote until the new one lands', () => {
    const view = checkoutView(quote, [{ productId: 'a', quantity: 3 }]);
    expect(view.total).toBe(0.45);
    expect(view.units).toBe(3);
    expect(view.lines).toHaveLength(1);
    expect(view.lines[0]).toMatchObject({ productId: 'a', quantity: 3, lineTotal: 0.45 });
  });

  it('saves the quoted lines for the return page', () => {
    expect(paidItems(quote)).toEqual([
      { productId: 'a', name: 'Water', imageUrl: null, quantity: 2, unitPrice: 0.15 },
      { productId: 'b', name: 'Chips', imageUrl: 'https://x/y.png', quantity: 1, unitPrice: 0.25 },
    ]);
  });
});
