'use client';

import { CheckoutButton } from '@/components/shop/CheckoutButton';
import { formatPrice } from '@/utils/money';

interface PayBarProps {
  units: number;
  total: number;
  currency: string;
  canPay: boolean;
  paying: boolean;
  onPay: () => void;
}

export function PayBar({ units, total, currency, canPay, paying, onPay }: PayBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md items-center rounded-t-[20px] bg-white px-5 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 shadow-[0_-2px_12px_rgba(221,235,249,0.8)]">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium leading-[1.2] text-vt-hint">
          {`Total \u00b7 ${units === 1 ? '1 item' : `${units} items`}`}
        </p>
        <p className="truncate text-[18px] font-bold text-vt-primary">{formatPrice(total, currency)}</p>
      </div>
      <CheckoutButton
        label="Pay now"
        mark="card"
        loading={paying}
        disabled={!canPay}
        onClick={onPay}
        className="ml-3 w-[176px]"
      />
    </div>
  );
}
