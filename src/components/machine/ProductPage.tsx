'use client';

import { useState } from 'react';
import { ChevronDown, Gift, Star } from 'lucide-react';
import { BackButton } from '@/components/shop/BackButton';
import { Btn } from '@/components/shop/Btn';
import { CheckoutButton } from '@/components/shop/CheckoutButton';
import { QuantityStepper } from '@/components/shop/Steppers';
import { cn } from '@/utils/cn';
import { formatPrice, multiplyMoney } from '@/utils/money';
import { addButtonMode, badgeFor } from '@/utils/menu-view';
import { BadgeChip, HealthPill } from './ProductBits';
import { ProductPhoto } from './ProductCard';
import type { GuestMenuProduct } from '@/types/guest-menu';

interface ProductPageProps {
  product: GuestMenuProduct;
  initialQuantity: number;
  canCheckout: boolean;
  onClose: () => void;
  onBuy: (quantity: number) => void;
  onClaim: () => void;
  canStepTo: (quantity: number) => boolean;
}

function Gallery({ product, onClose }: { product: GuestMenuProduct; onClose: () => void }) {
  const badge = badgeFor(product);
  const offer = product.saleType !== 'normal';
  const rated = product.healthRating !== null && product.healthRating > 0;
  return (
    <div
      className={cn(
        'relative h-[356px] overflow-hidden rounded-b-[28px] bg-vt-tile',
        offer ? 'shadow-[0_8px_24px_rgba(85,193,195,0.3)]' : 'shadow-[0_6px_16px_rgba(0,0,0,0.06)]',
      )}
    >
      <div className="absolute bottom-[58px] left-1/2 h-[18px] w-[150px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(0,0,0,0.16),transparent)]" />
      <div className="absolute inset-x-10 bottom-[64px] h-[210px] drop-shadow-[0_14px_10px_rgba(0,0,0,0.12)]">
        <ProductPhoto imageUrl={product.imageUrl} name={product.name} inset="" />
      </div>
      <div className="absolute inset-x-0 top-0 flex h-14 items-center bg-gradient-to-b from-white/55 to-white/0 px-3.5 backdrop-blur-[2px]">
        <BackButton onClick={onClose} label="Close product" overImage />
        <p className="mx-2 min-w-0 flex-1 truncate text-center text-[16px] font-semibold tracking-[-0.16px]">{product.name}</p>
        <span className="w-11" />
      </div>
      {badge && (
        <span className="absolute left-4 top-[70px]">
          <BadgeChip kind={badge} large />
        </span>
      )}
      {rated && (
        <span className="absolute bottom-3.5 left-4 inline-flex h-[26px] items-center gap-1 rounded-[13px] bg-white px-2 text-[11px] font-semibold shadow-[0_2px_6px_rgba(0,0,0,0.08)]">
          <Star className="h-[15px] w-[15px] text-[#F4B400]" fill="currentColor" strokeWidth={0} />
          {product.healthRating?.toFixed(1)}
        </span>
      )}
    </div>
  );
}

function Description({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 170;
  return (
    <section className="mt-3 border-t border-vt-well px-0.5 pt-3.5">
      <h3 className="text-[14px] font-semibold">Description</h3>
      <p className={cn('mt-1.5 text-[12.5px] leading-[1.55] text-vt-grey', !open && 'line-clamp-3')}>{text}</p>
      {long && (
        <button type="button" onClick={() => setOpen(!open)} className="mt-1 flex items-center text-[12px] font-semibold text-vt-press">
          {open ? 'View less' : 'View more'}
          <ChevronDown className={cn('h-[18px] w-[18px] transition-transform', open && 'rotate-180')} />
        </button>
      )}
    </section>
  );
}

function ActionBar(props: ProductPageProps) {
  const { product, initialQuantity, canCheckout, onBuy, onClaim, canStepTo } = props;
  const [quantity, setQuantity] = useState(initialQuantity);
  const mode = addButtonMode(product);
  const shell = 'fixed inset-x-0 bottom-0 mx-auto flex max-w-md items-center gap-3 border-t border-vt-well bg-white px-5 pb-[max(calc(env(safe-area-inset-bottom)+6px),12px)] pt-3';
  if (mode === 'sold_out') {
    return (
      <div className={shell}>
        <Btn disabled className="h-12">Sold out</Btn>
      </div>
    );
  }
  if (mode === 'claim') {
    return (
      <div className={shell}>
        <CheckoutButton dense label="Claim" mark={<Gift className="h-5 w-5 text-vt-ink" />} onClick={onClaim} className="flex-1" />
      </div>
    );
  }
  const total = formatPrice(multiplyMoney(product.price, quantity));
  const step = (next: number) => {
    if (next >= 1 && (next < quantity || canStepTo(next))) setQuantity(next);
  };
  return (
    <div className={shell}>
      <QuantityStepper count={quantity} onIncrease={() => step(quantity + 1)} onDecrease={() => step(quantity - 1)} />
      <CheckoutButton
        dense
        label={`${canCheckout ? 'Buy now' : 'Add to cart'} \u2022 ${total}`}
        onClick={() => onBuy(quantity)}
        className="min-w-0 flex-1"
      />
    </div>
  );
}

export function ProductPage(props: ProductPageProps) {
  const { product, onClose } = props;
  return (
    <div className="vt-sheet-up fixed inset-0 z-40 mx-auto max-w-md overflow-y-auto bg-white pb-28" role="dialog" aria-modal="true" aria-label={product.name}>
      <Gallery product={product} onClose={onClose} />
      <div className="px-5 pt-3">
        <div className="flex flex-wrap items-start gap-2 px-0.5 pt-1">
          <h2 className="min-w-0 flex-1 text-[18px] font-bold leading-[1.3] tracking-[-0.18px]">{product.name}</h2>
          <HealthPill rating={product.healthRating} />
        </div>
        <p className="mt-1.5 px-0.5 text-[16px] font-bold text-vt-primary">{formatPrice(product.price)}</p>
        {product.saleType === 'exclusive' && (
          <p className="mt-1 px-0.5 text-[12px] text-vt-grey">Only available in Vend IT machines</p>
        )}
        {product.description && <Description text={product.description} />}
      </div>
      <ActionBar {...props} />
    </div>
  );
}
