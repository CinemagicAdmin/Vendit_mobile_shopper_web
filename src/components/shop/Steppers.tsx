'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StepperProps {
  count: number;
  onIncrease: () => void;
  onDecrease: () => void;
  disabled?: boolean;
  name?: string;
}

export function LineStepper({ count, onIncrease, onDecrease, disabled, name = 'item' }: StepperProps) {
  const removes = count <= 1;
  return (
    <div className={cn('flex shrink-0 items-center rounded-full border border-vt-border p-0.5', disabled && 'opacity-40')}>
      <button
        type="button"
        aria-label={removes ? `Remove ${name}` : `One less ${name}`}
        onClick={onDecrease}
        disabled={disabled}
        className="flex h-8 w-8 items-center justify-center rounded-full"
      >
        {removes ? (
          <Trash2 className="h-[17px] w-[17px] text-vt-danger" strokeWidth={2.2} />
        ) : (
          <Minus className="h-[18px] w-[18px] text-vt-grey" strokeWidth={2.4} />
        )}
      </button>
      <span className="min-w-[18px] text-center text-[13px] font-semibold tabular-nums">{count}</span>
      <button
        type="button"
        aria-label={`One more ${name}`}
        onClick={onIncrease}
        disabled={disabled}
        className="flex h-8 w-8 items-center justify-center rounded-full"
      >
        <Plus className="h-[18px] w-[18px] text-vt-press" strokeWidth={2.4} />
      </button>
    </div>
  );
}

export function QuantityStepper({ count, onIncrease, onDecrease, disabled }: StepperProps) {
  const atMin = count <= 1;
  return (
    <div className="flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-vt-well px-1.5">
      <button
        type="button"
        aria-label="Fewer"
        onClick={onDecrease}
        disabled={disabled || atMin}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
      >
        <Minus className={cn('h-[18px] w-[18px]', atMin ? 'text-vt-muted' : 'text-black')} strokeWidth={2.4} />
      </button>
      <span className="min-w-6 text-center text-[14px] font-bold tabular-nums">{count}</span>
      <button
        type="button"
        aria-label="More"
        onClick={onIncrease}
        disabled={disabled}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-vt-primary shadow-[0_2px_6px_rgba(85,193,195,0.4)]"
      >
        <Plus className="h-[18px] w-[18px] text-white" strokeWidth={2.4} />
      </button>
    </div>
  );
}
