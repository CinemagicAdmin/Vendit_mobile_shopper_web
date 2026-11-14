'use client';

import { Gift, Plus } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { AddButtonMode } from '@/utils/menu-view';

interface ProductAddButtonProps {
  mode: AddButtonMode;
  count: number;
  name: string;
  onPress: () => void;
}

const LABELS: Record<AddButtonMode, string> = { add: 'Add', sold_out: 'Sold out', claim: 'Claim' };

export function ProductAddButton({ mode, count, name, onPress }: ProductAddButtonProps) {
  const disabled = mode === 'sold_out';
  const Icon = mode === 'claim' ? Gift : Plus;
  return (
    <button
      type="button"
      aria-label={`${LABELS[mode]} ${name}`}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onPress();
      }}
      className="relative flex h-10 w-10 shrink-0 items-center justify-center"
    >
      <span
        className={cn(
          'flex h-[30px] w-[30px] items-center justify-center rounded-[9px]',
          disabled ? 'bg-vt-line' : 'vt-breathe bg-vt-primary active:bg-vt-press',
        )}
      >
        <Icon className={cn('h-[19px] w-[19px]', disabled ? 'text-vt-muted' : 'text-white')} strokeWidth={mode === 'claim' ? 2.2 : 2.8} />
      </span>
      {count > 0 && (
        <span className="absolute right-[-1px] top-[-1px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-vt-red px-1 text-[9.5px] font-bold text-white ring-2 ring-white">
          {count}
        </span>
      )}
    </button>
  );
}
