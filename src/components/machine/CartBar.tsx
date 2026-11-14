'use client';

import { useRef, type ReactNode, type TouchEvent } from 'react';
import { ChevronUp, Info, Smartphone } from 'lucide-react';
import { CheckoutButton } from '@/components/shop/CheckoutButton';
import { GrabHandle } from '@/components/shop/BottomSheet';
import { ProductThumb } from '@/components/shop/ProductThumb';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/money';

export interface CartItemView {
  productId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  lineTotal: number;
}

export interface CartSummary {
  items: CartItemView[];
  units: number;
  total: number;
  closedReason: string | null;
}

interface SummaryRowProps {
  cart: CartSummary;
  open: boolean;
  onToggle: () => void;
  onCheckout: () => void;
  onGetApp: () => void;
}

function ProductStack({ items, units }: { items: CartItemView[]; units: number }) {
  const shown = items.slice(0, 3);
  return (
    <div className="relative h-10 shrink-0" style={{ width: 40 + (shown.length - 1) * 14 }}>
      {shown.map((item, index) => (
        <div key={item.productId} className="absolute top-0" style={{ left: index * 14 }}>
          <ProductThumb imageUrl={item.imageUrl} name={item.name} size={40} framed />
        </div>
      ))}
      <span className="absolute -right-1.5 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-vt-red px-1 text-[10px] font-bold text-white ring-2 ring-white">
        {units}
      </span>
    </div>
  );
}

export function CartSummaryRow({ cart, open, onToggle, onCheckout, onGetApp }: SummaryRowProps) {
  const closed = cart.closedReason !== null;
  return (
    <div className="flex items-center">
      <button type="button" onClick={onToggle} aria-label={open ? 'Hide cart items' : 'Show cart items'} className="flex min-w-0 flex-1 items-center text-left">
        <ProductStack items={cart.items} units={cart.units} />
        <span className="ml-3 min-w-0">
          <span className="flex items-center text-[12px] font-medium leading-[1.2] text-vt-hint">
            {cart.units === 1 ? '1 item' : `${cart.units} items`}
            <ChevronUp className={cn('ml-0.5 h-[18px] w-[18px] text-vt-grey transition-transform duration-[220ms]', open && 'rotate-180')} />
          </span>
          <span key={cart.total} className="vt-fade-in block truncate text-[18px] font-bold text-vt-primary">
            {formatPrice(cart.total)}
          </span>
        </span>
      </button>
      {closed ? (
        <CheckoutButton label="Get the app" mark={<Smartphone className="h-5 w-5 text-vt-ink" />} onClick={onGetApp} className="ml-3 w-[156px]" />
      ) : (
        <CheckoutButton label="Checkout" onClick={onCheckout} className="ml-3 w-[156px]" />
      )}
    </div>
  );
}

export function ClosedReason({ text }: { text: string }) {
  return (
    <p className="mt-2 flex items-start gap-1.5 text-[12px] leading-[1.4] text-vt-grey">
      <Info className="mt-px h-3.5 w-3.5 shrink-0" />
      {text}
    </p>
  );
}

export function CartSurface({ children, onSwipeUp }: { children: ReactNode; onSwipeUp?: () => void }) {
  const startY = useRef<number | null>(null);
  const onTouchStart = (event: TouchEvent) => {
    startY.current = event.touches[0]?.clientY ?? null;
  };
  const onTouchEnd = (event: TouchEvent) => {
    const endY = event.changedTouches[0]?.clientY;
    if (startY.current !== null && endY !== undefined && startY.current - endY > 24) onSwipeUp?.();
    startY.current = null;
  };
  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="vt-sheet-up fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md rounded-t-[20px] bg-white px-5 pb-[max(env(safe-area-inset-bottom),12px)] shadow-[0_-5px_10px_rgba(0,0,0,0.05)]"
    >
      <GrabHandle />
      {children}
    </div>
  );
}

export function CartBar(props: SummaryRowProps) {
  return (
    <CartSurface onSwipeUp={props.onToggle}>
      <CartSummaryRow {...props} />
      {props.cart.closedReason && <ClosedReason text={props.cart.closedReason} />}
    </CartSurface>
  );
}
