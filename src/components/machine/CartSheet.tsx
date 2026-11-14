'use client';

import { BottomSheet } from '@/components/shop/BottomSheet';
import { CartLineTile } from '@/components/shop/CartLineTile';
import { formatPrice } from '@/utils/money';
import { CartSummaryRow, ClosedReason, type CartSummary } from './CartBar';

interface CartSheetProps {
  cart: CartSummary;
  onClose: () => void;
  onCheckout: () => void;
  onGetApp: () => void;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
}

export function CartSheet({ cart, onClose, onCheckout, onGetApp, onIncrease, onDecrease }: CartSheetProps) {
  return (
    <BottomSheet label="Your items" onClose={onClose}>
      <h2 className="text-[15px] font-semibold leading-[1.2]">Your items</h2>
      <ul className="vt-no-scrollbar mt-1.5 max-h-[300px] overflow-y-auto">
        {cart.items.map((item) => (
          <li key={item.productId} className="py-2">
            <CartLineTile
              name={item.name}
              imageUrl={item.imageUrl}
              total={formatPrice(item.lineTotal)}
              quantity={item.quantity}
              thumbSize={48}
              onIncrease={() => onIncrease(item.productId)}
              onDecrease={() => onDecrease(item.productId)}
            />
          </li>
        ))}
      </ul>
      <div className="my-3 h-px bg-vt-line" />
      <CartSummaryRow cart={cart} open onToggle={onClose} onCheckout={onCheckout} onGetApp={onGetApp} />
      {cart.closedReason && <ClosedReason text={cart.closedReason} />}
    </BottomSheet>
  );
}
