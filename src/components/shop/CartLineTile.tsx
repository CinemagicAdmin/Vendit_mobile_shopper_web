'use client';

import type { ReactNode } from 'react';
import { ProductThumb } from './ProductThumb';
import { LineStepper } from './Steppers';

interface CartLineTileProps {
  name: string;
  imageUrl: string | null;
  total: string;
  quantity: number;
  thumbSize: number;
  onIncrease: () => void;
  onDecrease: () => void;
  disabled?: boolean;
  note?: ReactNode;
}

export function CartLineTile({ name, imageUrl, total, quantity, thumbSize, onIncrease, onDecrease, disabled, note }: CartLineTileProps) {
  return (
    <div className="flex items-center">
      <ProductThumb imageUrl={imageUrl} name={name} size={thumbSize} />
      <div className="ml-3 min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold leading-[1.3]">{name}</p>
        <p className="mt-[3px] text-[13px] font-bold text-vt-primary">{total}</p>
        {note}
      </div>
      <div className="ml-2">
        <LineStepper
          count={quantity}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
          disabled={disabled}
          name={name}
        />
      </div>
    </div>
  );
}
