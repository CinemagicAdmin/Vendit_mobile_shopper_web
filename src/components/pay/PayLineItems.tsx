'use client';

import Image from 'next/image';
import { Package } from 'lucide-react';
import { formatMoney } from '@/utils/money';
import type { GuestQuoteLine } from '@/types/guest-checkout';

interface PayLineItemsProps {
  lines: GuestQuoteLine[];
  total: number;
  currency: string;
}

function LineItem({ line, currency }: { line: GuestQuoteLine; currency: string }) {
  const name = line.name ?? 'Item';
  return (
    <li className="flex items-center gap-3 p-3">
      <div className="w-14 h-14 rounded-xl bg-[#f0fdfb] flex items-center justify-center shrink-0 overflow-hidden">
        {line.imageUrl ? (
          <Image
            src={line.imageUrl}
            alt={name}
            width={56}
            height={56}
            className="object-contain max-h-14"
            unoptimized
          />
        ) : (
          <Package className="h-6 w-6 text-gray-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 line-clamp-2">{name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {line.quantity} x {formatMoney(line.unitPrice, currency)}
        </p>
        {!line.available && (
          <p className="text-xs font-semibold text-red-500 mt-0.5">Not available</p>
        )}
      </div>
      <span className="text-sm font-bold text-gray-900 shrink-0">
        {formatMoney(line.lineTotal, currency)}
      </span>
    </li>
  );
}

export function PayLineItems({ lines, total, currency }: PayLineItemsProps) {
  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
      <ul className="divide-y divide-gray-100">
        {lines.map((line) => (
          <LineItem key={line.productId} line={line} currency={currency} />
        ))}
      </ul>
      <div className="flex items-center justify-between px-4 py-3 bg-[#e8faf9]">
        <span className="font-semibold text-gray-700">Total</span>
        <span className="text-lg font-bold text-[#2a9d95]">{formatMoney(total, currency)}</span>
      </div>
    </div>
  );
}
