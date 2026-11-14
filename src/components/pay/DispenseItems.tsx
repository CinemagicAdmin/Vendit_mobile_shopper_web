import { Check, Clock, RefreshCw } from 'lucide-react';
import { ProductThumb } from '@/components/shop/ProductThumb';
import { cn } from '@/utils/cn';
import type { DispenseRow, ItemChip } from '@/utils/dispense-progress';

const CHIPS: Record<ItemChip, { label: string; Icon: typeof Check; tone: string }> = {
  dropped: { label: 'Dropped', Icon: Check, tone: 'bg-[rgba(62,187,82,0.12)] text-vt-green-ink' },
  dispensing: { label: 'Dispensing', Icon: RefreshCw, tone: 'bg-[rgba(85,193,195,0.14)] text-vt-ink' },
  waiting: { label: 'Waiting', Icon: Clock, tone: 'bg-vt-sunken text-vt-hint' },
};

function StatusChip({ chip }: { chip: ItemChip }) {
  const { label, Icon, tone } = CHIPS[chip];
  return (
    <span className={cn('inline-flex h-6 shrink-0 items-center gap-1 rounded-full pl-[7px] pr-[9px] text-[11px] font-semibold', tone)}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
      {label}
    </span>
  );
}

export function DispenseItems({ rows }: { rows: DispenseRow[] }) {
  if (rows.length === 0) return null;
  return (
    <ul className="overflow-hidden rounded-[17.9px] border border-vt-line bg-white shadow-[0_2px_10px_rgba(221,235,249,0.7)]">
      {rows.map(({ item, chip }, index) => (
        <li key={item.productId} className={cn('flex items-center px-3.5 py-3', index > 0 && 'border-t border-vt-track')}>
          <ProductThumb imageUrl={item.imageUrl} name={item.name ?? 'Item'} size={44} className={chip === 'waiting' ? 'opacity-50' : undefined} />
          <div className="ml-3 min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">{item.name ?? 'Item'}</p>
            <p className="mt-0.5 text-[11px] text-vt-grey">Qty {item.quantity}</p>
            {chip === 'dispensing' && (
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-vt-soft">
                <div className="vt-sweep h-full w-[40%] rounded-full bg-vt-primary" />
              </div>
            )}
          </div>
          <span className="ml-3">
            <StatusChip chip={chip} />
          </span>
        </li>
      ))}
    </ul>
  );
}
