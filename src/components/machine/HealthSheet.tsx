'use client';

import { Star } from 'lucide-react';
import { BottomSheet } from '@/components/shop/BottomSheet';
import { Btn } from '@/components/shop/Btn';
import { healthLevel, starCount } from '@/utils/menu-view';
import { HEALTH } from './ProductBits';

const MESSAGES: Record<number, string> = {
  1: 'Products high in sugar, low in protein, or with minimal nutritional benefits.',
  2: 'Balanced products with reasonable macros but slightly higher calories, fats, or sugar.',
  3: 'High protein, low sugar, low fat, Nutrient-dense products.',
};

export function HealthSheet({ rating, onClose }: { rating: number | null; onClose: () => void }) {
  const stars = starCount(rating);
  const level = healthLevel(rating);
  return (
    <BottomSheet label="Health rating" onClose={onClose} className="rounded-t-[24px] px-6">
      <div className="flex flex-col items-center pb-4 pt-2 text-center">
        <div className="flex gap-0.5">
          {Array.from({ length: stars }, (_, index) => (
            <Star key={index} className="h-6 w-6 text-[#FFC107]" fill="currentColor" strokeWidth={0} />
          ))}
        </div>
        <p className="mt-3 text-[18px] font-bold">{level ? HEALTH[level].label : 'Not rated yet'}</p>
        <p className="mt-2 text-[14px] text-vt-grey">
          {level ? MESSAGES[Math.min(Math.max(stars, 1), 3)] : 'This product does not have a health rating yet.'}
        </p>
        <Btn className="mt-6 rounded-[12px] text-[16px]" onClick={onClose}>
          Got it
        </Btn>
      </div>
    </BottomSheet>
  );
}
