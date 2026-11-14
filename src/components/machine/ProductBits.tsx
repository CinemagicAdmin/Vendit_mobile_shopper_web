import { Award, Ban, Gift, Leaf, Star } from 'lucide-react';
import { cn } from '@/utils/cn';
import { healthLevel, starCount, type BadgeKind, type HealthLevel } from '@/utils/menu-view';

const BADGES: Record<BadgeKind, { label: string; Icon: typeof Ban; fill: string }> = {
  sold_out: { label: 'Sold out', Icon: Ban, fill: 'bg-vt-grey' },
  exclusive: { label: 'Exclusive', Icon: Award, fill: 'bg-vt-press' },
  offer: { label: 'Offer', Icon: Gift, fill: 'bg-vt-green' },
};

export const HEALTH: Record<HealthLevel, { label: string; chip: string; disc: string; border: string }> = {
  very: { label: 'Very Healthy', chip: 'bg-[#E4F5ED] text-[#2B8A3C]', disc: 'bg-vt-green', border: 'border-[rgba(62,187,82,0.35)]' },
  moderate: { label: 'Moderately Healthy', chip: 'bg-[#FFF4E0] text-[#8A5F00]', disc: 'bg-vt-yellow', border: 'border-[rgba(221,164,78,0.35)]' },
  less: { label: 'Less Healthy', chip: 'bg-[#FDECEC] text-[#B6262C]', disc: 'bg-vt-danger', border: 'border-[rgba(224,81,81,0.35)]' },
};

export function BadgeChip({ kind, large }: { kind: BadgeKind; large?: boolean }) {
  const { label, Icon, fill } = BADGES[kind];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full pr-2 font-bold text-white',
        large ? 'h-[26px] gap-1 pl-2 text-[11px]' : 'h-[22px] gap-[3px] pl-1.5 text-[10px]',
        fill,
      )}
    >
      <Icon className={large ? 'h-3.5 w-3.5' : 'h-3 w-3'} strokeWidth={2.6} />
      {label}
    </span>
  );
}

function formatRating(rating: number): string {
  return Number.isInteger(rating) ? rating.toFixed(0) : rating.toFixed(1);
}

export function RatingRow({ rating, onInfo }: { rating: number | null; onInfo?: () => void }) {
  const filled = starCount(rating);
  const rated = rating !== null && rating > 0;
  return (
    <button
      type="button"
      onClick={onInfo}
      aria-label={rated ? `Health rating ${formatRating(rating)} out of 5` : 'Not rated'}
      className="flex h-[15px] items-center pl-0.5"
    >
      {[0, 1, 2, 3, 4].map((index) => (
        <Star
          key={index}
          className={cn('mr-px h-3.5 w-3.5', index < filled ? 'text-vt-yellow' : 'text-vt-star')}
          fill="currentColor"
          strokeWidth={0}
        />
      ))}
      {rated && <span className="ml-[3px] text-[10px] font-medium text-vt-grey">({formatRating(rating)})</span>}
    </button>
  );
}

export function HealthChip({ rating }: { rating: number | null }) {
  const level = healthLevel(rating);
  if (!level) return <div className="h-5" />;
  const { label, chip } = HEALTH[level];
  return (
    <div className="flex h-5 items-center">
      <span className={cn('ml-0.5 inline-flex h-5 items-center gap-[3px] rounded-[10px] pl-[5px] pr-[7px] text-[9.5px] font-semibold leading-[1.2]', chip)}>
        <Leaf className="h-3 w-3" strokeWidth={2.4} />
        {label}
      </span>
    </div>
  );
}

export function HealthPill({ rating }: { rating: number | null }) {
  const level = healthLevel(rating);
  if (!level) return null;
  const { label, disc, border } = HEALTH[level];
  return (
    <span className={cn('inline-flex h-[26px] shrink-0 items-center gap-1.5 rounded-[13px] border bg-white pl-1 pr-2.5 text-[11px] font-semibold', border)}>
      <span className={cn('flex h-[18px] w-[18px] items-center justify-center rounded-full', disc)}>
        <Leaf className="h-3 w-3 text-white" strokeWidth={2.4} />
      </span>
      {label}
    </span>
  );
}
