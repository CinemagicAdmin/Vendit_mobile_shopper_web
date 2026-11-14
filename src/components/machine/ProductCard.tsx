'use client';

import Image from 'next/image';
import type { KeyboardEvent, MouseEvent } from 'react';
import { ImageOff, Info } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/money';
import { addButtonMode, badgeFor, opensCard } from '@/utils/menu-view';
import { BadgeChip, HealthChip, RatingRow } from './ProductBits';
import { ProductAddButton } from './ProductAddButton';
import type { GuestMenuProduct } from '@/types/guest-menu';

interface ProductCardProps {
  product: GuestMenuProduct;
  count: number;
  index: number;
  onOpen: () => void;
  onAdd: () => void;
  onHealthInfo: () => void;
}

export function ProductPhoto({ imageUrl, name, inset }: { imageUrl: string | null; name: string; inset: string }) {
  if (!imageUrl) return <ImageOff className="absolute inset-0 m-auto h-6 w-6 text-vt-muted" />;
  return <Image src={imageUrl} alt={name} fill sizes="200px" className={cn('object-contain', inset)} unoptimized />;
}

function stop(handler: () => void) {
  return (event: MouseEvent) => {
    event.stopPropagation();
    handler();
  };
}

export function ProductCard({ product, count, index, onOpen, onAdd, onHealthInfo }: ProductCardProps) {
  const badge = badgeFor(product);
  const exclusive = product.saleType === 'exclusive';
  const onKey = (event: KeyboardEvent) => {
    if (!opensCard(event.key, event.target === event.currentTarget)) return;
    event.preventDefault();
    onOpen();
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={onKey}
      style={{ animationDelay: `${Math.min(index, 6) * 50}ms` }}
      className={cn(
        'vt-rise relative flex aspect-[0.71] flex-col rounded-2xl bg-white p-2 text-left',
        exclusive
          ? 'vt-exclusive'
          : 'border border-vt-line shadow-[0_2px_10px_rgba(221,235,249,0.7)]',
      )}
    >
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[12px] bg-vt-sunken">
        <ProductPhoto imageUrl={product.imageUrl} name={product.name} inset="p-1.5" />
        {badge && (
          <span className="absolute left-1.5 top-1.5">
            <BadgeChip kind={badge} />
          </span>
        )}
        <button
          type="button"
          aria-label="What the health rating means"
          onClick={stop(onHealthInfo)}
          className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center"
        >
          <Info className="h-[18px] w-[18px] text-vt-hint" />
        </button>
      </div>
      <p className="mt-1.5 line-clamp-2 h-[31px] px-0.5 text-[12px] font-semibold leading-[1.3]">{product.name}</p>
      <div className="mt-1.5" onClick={(event) => event.stopPropagation()}>
        <RatingRow rating={product.healthRating} onInfo={onHealthInfo} />
      </div>
      <div className="mt-1.5">
        <HealthChip rating={product.healthRating} />
      </div>
      <div className="mt-1.5 flex h-10 items-center rounded-[12px] border border-[rgba(85,193,195,0.22)] bg-vt-tile pl-2.5 shadow-[0_0_0_3px_rgba(85,193,195,0.06),0_4px_12px_rgba(85,193,195,0.14)]">
        <span className="min-w-0 flex-1 truncate text-[14px] font-bold leading-[1.15] text-vt-ink">
          {formatPrice(product.price)}
        </span>
        <ProductAddButton mode={addButtonMode(product)} count={count} name={product.name} onPress={onAdd} />
      </div>
    </div>
  );
}
