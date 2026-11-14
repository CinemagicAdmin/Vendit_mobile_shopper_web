import { describe, expect, it } from 'vitest';
import {
  currentItem,
  dispenseRows,
  ringFraction,
  ringHeadline,
  totalUnitsOf,
} from '@/utils/dispense-progress';
import type { GuestPaidItem } from '@/types/guest-checkout';

const item = (productId: string, quantity: number): GuestPaidItem => ({
  productId,
  name: productId,
  imageUrl: null,
  quantity,
  unitPrice: 0.1,
});
const basket = [item('water', 2), item('chips', 1), item('juice', 1)];
const chips = (confirmed: number, phase: 'preparing' | 'dispensing' | 'done') =>
  dispenseRows(basket, confirmed, phase).map((row) => row.chip);

describe('ringFraction', () => {
  it('fills only from confirmed units', () => {
    expect(ringFraction(0, 4, 'preparing')).toBe(0);
    expect(ringFraction(2, 4, 'dispensing')).toBe(0.5);
    expect(ringFraction(9, 4, 'dispensing')).toBe(1);
    expect(ringFraction(1, 0, 'dispensing')).toBe(0);
    expect(ringFraction(0, 4, 'done')).toBe(1);
  });
});

describe('dispenseRows', () => {
  it('waits on every line while preparing', () => {
    expect(chips(0, 'preparing')).toEqual(['waiting', 'waiting', 'waiting']);
  });

  it('marks dropped lines and the one in progress in basket order', () => {
    expect(chips(0, 'dispensing')).toEqual(['dispensing', 'waiting', 'waiting']);
    expect(chips(1, 'dispensing')).toEqual(['dispensing', 'waiting', 'waiting']);
    expect(chips(2, 'dispensing')).toEqual(['dropped', 'dispensing', 'waiting']);
    expect(chips(3, 'dispensing')).toEqual(['dropped', 'dropped', 'dispensing']);
  });

  it('drops everything when done', () => {
    expect(chips(0, 'done')).toEqual(['dropped', 'dropped', 'dropped']);
  });
});

describe('currentItem and totals', () => {
  it('follows the confirmed count', () => {
    expect(currentItem(basket, 0)?.productId).toBe('water');
    expect(currentItem(basket, 2)?.productId).toBe('chips');
    expect(currentItem(basket, 4)?.productId).toBe('juice');
    expect(currentItem([], 0)).toBeNull();
  });

  it('prefers the authorised units and falls back to the saved basket', () => {
    expect(totalUnitsOf(basket, 3)).toBe(3);
    expect(totalUnitsOf(basket, 0)).toBe(4);
  });
});

describe('ringHeadline', () => {
  it('uses the app copy for each phase', () => {
    expect(ringHeadline('preparing', 0, 4, 'Lobby')).toEqual({
      title: 'Preparing your order',
      subtitle: '4 items to dispense. Please stay near Lobby.',
    });
    expect(ringHeadline('dispensing', 2, 4, null)).toEqual({
      title: 'Dispensing 3 of 4',
      subtitle: 'Please stay near the machine.',
    });
    expect(ringHeadline('dispensing', 4, 4, 'Lobby').title).toBe('Dispensing 4 of 4');
    expect(ringHeadline('done', 4, 4, 'Lobby')).toEqual({
      title: 'Ready to collect',
      subtitle: 'Take your items from the pickup tray at the bottom of the machine.',
    });
  });
});
