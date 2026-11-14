'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { CartLineTile } from '@/components/shop/CartLineTile';
import { formatPrice } from '@/utils/money';
import type { GuestQuoteLine } from '@/types/guest-checkout';

interface PayLineItemsProps {
  lines: GuestQuoteLine[];
  currency: string;
  moreUrl: string;
  locked: boolean;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
}

export function PayLineItems({ lines, currency, moreUrl, locked, onIncrease, onDecrease }: PayLineItemsProps) {
  return (
    <section aria-label="Your items" className="space-y-2.5">
      <div className="flex items-center justify-between px-1 pt-1.5">
        <h2 className="text-[15px] font-semibold">Your items</h2>
        <Link href={moreUrl} className="flex items-center text-[12px] font-medium text-vt-press">
          Add more items
          <ChevronRight className="h-[18px] w-[18px]" />
        </Link>
      </div>
      {lines.map((line) => (
        <div key={line.productId} className="rounded-2xl bg-white p-3 shadow-[0_0_8px_rgba(221,235,249,0.8)]">
          <CartLineTile
            name={line.name ?? 'Item'}
            imageUrl={line.imageUrl}
            total={formatPrice(line.lineTotal, currency)}
            quantity={line.quantity}
            thumbSize={56}
            disabled={locked}
            onIncrease={() => onIncrease(line.productId)}
            onDecrease={() => onDecrease(line.productId)}
            note={
              !line.available && <p className="mt-0.5 text-[11px] font-semibold text-vt-danger">Not available right now</p>
            }
          />
        </div>
      ))}
    </section>
  );
}
