'use client';

import { useState } from 'react';
import { ChevronDown, Copy } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { GuestPaidItem } from '@/types/guest-checkout';

interface OrderDetailsProps {
  reference: string | null;
  machineName: string | null;
  items: GuestPaidItem[];
  onCopied: (label: string) => void;
}

const SHOWN = 3;

function Row({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div className="flex min-h-[38px] items-center py-1.5 text-left">
      <span className="w-[74px] shrink-0 text-[12px] text-vt-grey">{label}</span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-vt-dark">{value}</span>
      {onCopy && (
        <button type="button" aria-label={`Copy ${label.toLowerCase()}`} onClick={onCopy} className="-mr-2 flex h-9 w-9 items-center justify-center">
          <Copy className="h-4 w-4 text-vt-grey" />
        </button>
      )}
    </div>
  );
}

function Products({ items }: { items: GuestPaidItem[] }) {
  const [all, setAll] = useState(false);
  const units = items.reduce((total, item) => total + item.quantity, 0);
  const shown = all ? items : items.slice(0, SHOWN);
  return (
    <div className="border-t border-vt-star pt-2 text-left">
      <p className="flex justify-between text-[12px] font-semibold text-vt-grey">
        <span>Products</span>
        <span>{units === 1 ? '1 item' : `${units} items`}</span>
      </p>
      {shown.map((item, index) => (
        <div key={item.productId} className={cn('flex items-center gap-3 py-2.5', index > 0 && 'border-t border-[#E9E9E9]')}>
          <p className="line-clamp-2 min-w-0 flex-1 text-[14px] font-semibold text-vt-dark">{item.name ?? 'Item'}</p>
          <span className="rounded-[20px] border border-vt-star bg-white px-2 py-0.5 text-[12px] font-semibold">{`\u00d7${item.quantity}`}</span>
        </div>
      ))}
      {items.length > SHOWN && (
        <button type="button" onClick={() => setAll(!all)} className="flex items-center gap-1 pb-2 text-[13px] font-semibold">
          {all ? 'Show less' : `Show all ${items.length} products`}
          <ChevronDown className={cn('h-4 w-4 transition-transform', all && 'rotate-180')} />
        </button>
      )}
    </div>
  );
}

export function OrderDetails({ reference, machineName, items, onCopied }: OrderDetailsProps) {
  if (!reference && !machineName && items.length === 0) return null;
  const copy = () => {
    if (!reference) return;
    void navigator.clipboard?.writeText(reference).then(() => onCopied('Reference copied'), () => undefined);
  };
  return (
    <div className="mt-5 w-full rounded-[12px] bg-vt-well px-3.5 py-1.5">
      {reference && <Row label="Reference" value={reference} onCopy={copy} />}
      {machineName && <Row label="Machine" value={machineName} />}
      {items.length > 0 && <Products items={items} />}
    </div>
  );
}
