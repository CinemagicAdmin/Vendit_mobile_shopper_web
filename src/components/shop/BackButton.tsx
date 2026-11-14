'use client';

import { ChevronLeft } from 'lucide-react';
import { cn } from '@/utils/cn';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  overImage?: boolean;
}

export function BackButton({ onClick, label = 'Back', overImage }: BackButtonProps) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="flex h-11 w-11 shrink-0 items-center justify-center">
      <span
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-[12px] border border-vt-line bg-white',
          overImage ? 'shadow-[0_2px_10px_rgba(0,0,0,0.12)]' : 'shadow-[0_2px_8px_rgba(0,0,0,0.05)]',
        )}
      >
        <ChevronLeft className="h-5 w-5 text-vt-ink" strokeWidth={2.6} />
      </span>
    </button>
  );
}
