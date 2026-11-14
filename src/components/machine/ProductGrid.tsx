'use client';

import { SearchX } from 'lucide-react';
import { ProductCard } from './ProductCard';
import type { GuestMenuProduct } from '@/types/guest-menu';

interface ProductGridProps {
  products: GuestMenuProduct[];
  countOf: (product: GuestMenuProduct) => number;
  onOpen: (product: GuestMenuProduct) => void;
  onAdd: (product: GuestMenuProduct) => void;
  onHealthInfo: (product: GuestMenuProduct) => void;
}

const GRID = 'grid grid-cols-2 gap-2.5 px-5 pb-4 pt-2.5';

export function ProductGrid({ products, countOf, onOpen, onAdd, onHealthInfo }: ProductGridProps) {
  return (
    <div className={GRID}>
      {products.map((product, index) => (
        <ProductCard
          key={product.key}
          product={product}
          index={index}
          count={countOf(product)}
          onOpen={() => onOpen(product)}
          onAdd={() => onAdd(product)}
          onHealthInfo={() => onHealthInfo(product)}
        />
      ))}
    </div>
  );
}

export function ProductGridShimmer() {
  return (
    <div className={GRID} aria-label="Loading products">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <div key={index} className="flex aspect-[0.71] flex-col rounded-2xl border border-vt-line bg-white p-2 shadow-[0_2px_10px_rgba(221,235,249,0.7)]">
          <div className="vt-shimmer min-h-0 flex-1 rounded-[12px] opacity-50" />
          <div className="vt-shimmer mt-1.5 h-3 w-[90%] rounded" />
          <div className="vt-shimmer mt-1.5 h-3 w-[60%] rounded" />
          <div className="mt-1.5 flex gap-1">
            {[0, 1, 2, 3, 4].map((dot) => (
              <div key={dot} className="vt-shimmer h-3 w-3 rounded-full" />
            ))}
          </div>
          <div className="vt-shimmer mt-1.5 h-5 w-[84px] rounded-full" />
          <div className="vt-shimmer mt-1.5 h-10 rounded-[12px]" />
        </div>
      ))}
    </div>
  );
}

export function NoSearchResults() {
  return (
    <div className="flex flex-col items-center px-8 py-16 text-center">
      <SearchX className="h-8 w-8 text-vt-muted" />
      <p className="mt-3 text-[14px] font-semibold">No products found</p>
      <p className="mt-1 text-[12px] text-vt-grey">Try another product name.</p>
    </div>
  );
}
