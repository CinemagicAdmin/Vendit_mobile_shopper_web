'use client';

import { useState } from 'react';
import { guestStorage } from '@/utils/guest-storage';
import {
  addOne,
  blockMessage,
  buyNow,
  removeOne,
  stepperBlock,
  totalUnits,
  unitsOf,
  type CartLine,
} from '@/utils/guest-cart';
import { buyableLines, cardFor, stockOf } from '@/utils/menu-view';
import { multiplyMoney, sumMoney } from '@/utils/money';
import { unavailableCopy } from '@/components/pay/PayUnavailable';
import type { CartItemView, CartSummary } from '@/components/machine/CartBar';
import type { GuestMenu } from '@/types/guest-menu';

function summarise(menu: GuestMenu, lines: CartLine[]): CartSummary {
  const items: CartItemView[] = lines.flatMap((line) => {
    const card = cardFor(menu.products, line.productId);
    if (!card) return [];
    const lineTotal = multiplyMoney(card.price, line.quantity);
    return [{ productId: line.productId, name: card.name, imageUrl: card.imageUrl, quantity: line.quantity, lineTotal }];
  });
  return {
    items,
    units: totalUnits(lines),
    total: sumMoney(items.map((item) => item.lineTotal)),
    closedReason: menu.checkout.open ? null : unavailableCopy(menu.checkout.reason),
  };
}

// Mounted once the menu is in, so the saved cart is read on the client only.
export function useMachineCart(menu: GuestMenu, notify: (message: string) => void) {
  const machineId = menu.machine.id;
  const [stored, setStored] = useState<CartLine[]>(() => guestStorage.getCart(machineId));
  const lines = buyableLines(stored, menu.products);

  const commit = (next: CartLine[]) => {
    setStored(next);
    guestStorage.saveCart(machineId, next);
  };

  const add = (productId: string): boolean => {
    const change = addOne(lines, productId, stockOf(menu.products, productId));
    if (!change.ok) notify(change.message);
    else commit(change.lines);
    return change.ok;
  };

  const decrease = (productId: string) => commit(removeOne(lines, productId));

  const buy = (productId: string, quantity: number): CartLine[] | null => {
    const change = buyNow(lines, productId, quantity);
    if (!change.ok) {
      notify(change.message);
      return null;
    }
    commit(change.lines);
    return change.lines;
  };

  const canStepTo = (productId: string, quantity: number): boolean => {
    const stock = stockOf(menu.products, productId);
    const block = stepperBlock(lines, productId, quantity, stock);
    if (block) notify(blockMessage(block, stock));
    return block === null;
  };

  return {
    lines,
    summary: summarise(menu, lines),
    unitsOf: (productId: string) => unitsOf(lines, productId),
    add,
    decrease,
    buy,
    canStepTo,
  };
}
