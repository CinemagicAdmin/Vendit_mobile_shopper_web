'use client';

import type { Ref } from 'react';
import { cn } from '@/utils/cn';
import { sentenceCase } from '@/utils/menu-view';
import type { GuestMenuCategory } from '@/types/guest-menu';

interface CategoryChipsProps {
  categories: GuestMenuCategory[];
  selectedId: string | null;
  onSelect: (categoryId: string) => void;
  ref?: Ref<HTMLElement>;
}

export function CategoryChips({ categories, selectedId, onSelect, ref }: CategoryChipsProps) {
  return (
    <nav ref={ref} aria-label="Categories" className="sticky top-14 z-20 bg-white">
      <div className="vt-no-scrollbar flex gap-2 overflow-x-auto px-5 pb-3 pt-1">
        {categories.map((category, index) => {
          const selected = selectedId === null ? index === 0 : category.id === selectedId;
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(category.id)}
              className={cn(
                'h-[38px] shrink-0 whitespace-nowrap rounded-full border px-4 text-[13px] transition-[background-color,border-color,color,box-shadow] duration-[140ms]',
                selected
                  ? 'border-vt-primary bg-vt-primary font-semibold text-white shadow-[0_2px_8px_rgba(85,193,195,0.3)]'
                  : 'border-vt-border bg-white font-medium text-vt-grey',
              )}
            >
              {sentenceCase(category.name)}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

const SHIMMER_WIDTHS = [86, 82, 74, 80];

export function CategoryChipsShimmer() {
  return (
    <div className="flex gap-2 overflow-hidden bg-white px-5 pb-3 pt-1">
      {SHIMMER_WIDTHS.map((width) => (
        <div key={width} className="vt-shimmer-light h-[38px] shrink-0 rounded-full" style={{ width }} />
      ))}
    </div>
  );
}
