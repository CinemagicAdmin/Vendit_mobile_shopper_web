import Image from 'next/image';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Confetti } from './Confetti';
import type { GuestPaidItem } from '@/types/guest-checkout';

const RADIUS = 110;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GLINT = CIRCUMFERENCE * 0.04;

interface DispenseRingProps {
  fraction: number;
  done: boolean;
  item: GuestPaidItem | null;
}

function Core({ done, item }: { done: boolean; item: GuestPaidItem | null }) {
  if (done) {
    return (
      <span className="vt-pop flex h-24 w-24 items-center justify-center rounded-full bg-vt-green shadow-[0_10px_22px_rgba(62,187,82,0.35)]">
        <Check className="h-[52px] w-[52px] text-white" strokeWidth={3} />
      </span>
    );
  }
  if (!item?.imageUrl) {
    return <span className="h-12 w-12 animate-spin rounded-full border-4 border-transparent border-r-vt-primary border-t-vt-primary" aria-hidden />;
  }
  return (
    <span key={item.productId} className="vt-drop-in relative h-[120px] w-[120px] overflow-hidden rounded-full bg-white">
      <Image src={item.imageUrl} alt={item.name ?? 'Your item'} fill sizes="120px" className="object-cover" unoptimized />
    </span>
  );
}

export function DispenseRing({ fraction, done, item }: DispenseRingProps) {
  const center = 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full';
  return (
    <div className="relative mx-auto h-[240px] w-[240px]" role="img" aria-label={done ? 'All items dispensed' : `${Math.round(fraction * 100)}% dispensed`}>
      <div className={cn(center, 'h-[192px] w-[192px] transition-colors duration-[400ms]', done ? 'bg-[#F1FAF2]' : 'bg-vt-sunken')} />
      <svg viewBox="0 0 240 240" className="absolute inset-0 -rotate-90">
        <circle cx="120" cy="120" r={RADIUS} fill="none" strokeWidth="8" stroke={done ? '#DDF3E1' : '#E3F4F4'} />
        {fraction > 0 && (
          <circle
            cx="120"
            cy="120"
            r={RADIUS}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            stroke={done ? '#3EBB52' : '#55C1C3'}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
            style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.65,0,0.35,1), stroke 400ms' }}
          />
        )}
        {!done && (
          <circle
            className="vt-spin"
            style={{ transformOrigin: '120px 120px' }}
            cx="120"
            cy="120"
            r={RADIUS}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            stroke="rgba(255,255,255,0.9)"
            strokeDasharray={`${GLINT} ${CIRCUMFERENCE}`}
          />
        )}
      </svg>
      <div className={cn(center, 'flex h-[156px] w-[156px] items-center justify-center bg-white shadow-[0_6px_18px_rgba(34,57,58,0.06)]')}>
        <Core done={done} item={item} />
      </div>
      {done && <Confetti />}
    </div>
  );
}
