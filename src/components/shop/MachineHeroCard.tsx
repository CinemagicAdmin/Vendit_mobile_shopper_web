import Image from 'next/image';
import { MapPin } from 'lucide-react';

interface MachineHeroCardProps {
  name: string;
  location: string | null;
  imageUrl: string | null;
}

export function MachineLogoTile({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  return (
    <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      {imageUrl ? (
        <Image src={imageUrl} alt={name} fill sizes="84px" className="object-contain" unoptimized />
      ) : (
        <Image src="/shop/app-logo.svg" alt="" fill className="object-contain p-3" unoptimized />
      )}
    </div>
  );
}

export function MachineHeroCard({ name, location, imageUrl }: MachineHeroCardProps) {
  return (
    <div className="flex items-center rounded-2xl border border-[rgba(85,193,195,0.35)] bg-vt-tile p-3">
      <MachineLogoTile imageUrl={imageUrl} name={name} />
      <div className="ml-3 min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold leading-[1.2]">{name}</p>
        {location && (
          <p className="mt-1 flex items-center text-[11px] text-vt-grey">
            <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
            <span className="ml-[3px] truncate">{location}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export function MachineHeroSkeleton() {
  return (
    <div className="flex items-center rounded-2xl border border-[rgba(85,193,195,0.35)] bg-vt-tile p-3">
      <div className="vt-shimmer-light h-[84px] w-[84px] rounded-2xl" />
      <div className="ml-3 flex-1 space-y-2">
        <div className="vt-shimmer-light h-3.5 w-[60%] rounded" />
        <div className="vt-shimmer-light h-3 w-[85%] rounded" />
      </div>
    </div>
  );
}
