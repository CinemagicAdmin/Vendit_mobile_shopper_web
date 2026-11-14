import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ProductThumbProps {
  imageUrl: string | null;
  name: string;
  size: number;
  framed?: boolean;
  className?: string;
}

export function ProductThumb({ imageUrl, name, size, framed, className }: ProductThumbProps) {
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-[12px] bg-vt-sunken',
        framed && 'ring-2 ring-white shadow-[0_2px_6px_rgba(0,0,0,0.08)]',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {imageUrl ? (
        <Image src={imageUrl} alt={name} fill sizes={`${size}px`} className="object-contain p-[3px]" unoptimized />
      ) : (
        <ImageOff className="absolute inset-0 m-auto h-1/2 w-1/2 max-h-6 max-w-6 text-vt-muted" />
      )}
    </div>
  );
}
