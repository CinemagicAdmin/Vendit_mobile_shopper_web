import type { GuestPaidItem } from '@/types/guest-checkout';

export type ItemChip = 'dropped' | 'dispensing' | 'waiting';

export type RingPhase = 'preparing' | 'dispensing' | 'done';

export interface DispenseRow {
  item: GuestPaidItem;
  chip: ItemChip;
}

export interface RingHeadline {
  title: string;
  subtitle: string;
}

// The ring only moves when the machine confirms a unit, never on a timer.
export function ringFraction(confirmed: number, total: number, phase: RingPhase): number {
  if (phase === 'done') return 1;
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, confirmed / total));
}

export function totalUnitsOf(items: GuestPaidItem[], authorized: number): number {
  if (authorized > 0) return authorized;
  return items.reduce((total, item) => total + item.quantity, 0);
}

// Status reports counts only, so units are assumed to drop in basket order.
export function dispenseRows(items: GuestPaidItem[], confirmed: number, phase: RingPhase): DispenseRow[] {
  let before = 0;
  let current = phase === 'dispensing';
  return items.map((item) => {
    const end = before + item.quantity;
    before = end;
    if (phase === 'done' || confirmed >= end) return { item, chip: 'dropped' };
    if (current) {
      current = false;
      return { item, chip: 'dispensing' };
    }
    return { item, chip: 'waiting' };
  });
}

export function currentItem(items: GuestPaidItem[], confirmed: number): GuestPaidItem | null {
  let before = 0;
  for (const item of items) {
    before += item.quantity;
    if (confirmed < before) return item;
  }
  return items[items.length - 1] ?? null;
}

export function ringHeadline(phase: RingPhase, confirmed: number, total: number, machineName: string | null): RingHeadline {
  const machine = machineName ?? 'the machine';
  if (phase === 'done') {
    return {
      title: 'Ready to collect',
      subtitle: 'Take your items from the pickup tray at the bottom of the machine.',
    };
  }
  if (phase === 'preparing' && confirmed === 0) {
    const items = total === 1 ? '1 item' : `${total} items`;
    const lead = total > 0 ? `${items} to dispense. ` : '';
    return { title: 'Preparing your order', subtitle: `${lead}Please stay near ${machine}.` };
  }
  const shown = Math.min(confirmed + 1, Math.max(total, 1));
  return { title: `Dispensing ${shown} of ${Math.max(total, shown)}`, subtitle: `Please stay near ${machine}.` };
}
