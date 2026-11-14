'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export type CheckoutMark = 'arrow' | 'card' | ReactNode;

interface CheckoutButtonProps {
  label: string;
  onClick?: () => void;
  mark?: CheckoutMark;
  loading?: boolean;
  disabled?: boolean;
  dense?: boolean;
  className?: string;
}

function MarkTile({ mark }: { mark: CheckoutMark }) {
  let content: ReactNode = mark;
  if (mark === 'arrow') content = <ArrowRight className="h-5 w-5 text-vt-ink" strokeWidth={2.4} />;
  if (mark === 'card') content = <Image src="/shop/card-logo.svg" alt="" width={22} height={22} unoptimized />;
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-white">{content}</span>
  );
}

export function CheckoutButton({
  label,
  onClick,
  mark = 'arrow',
  loading,
  disabled,
  dense,
  className,
}: CheckoutButtonProps) {
  const live = !disabled && !loading && onClick !== undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'relative isolate flex h-12 shrink-0 items-center overflow-hidden rounded-[15px] bg-vt-primary text-white transition-[background-color,transform,opacity] duration-[90ms] ease-out hover:bg-vt-hover active:translate-y-px active:bg-vt-press',
        live && 'shadow-[0_6px_16px_rgba(85,193,195,0.45),0_0_0_3px_rgba(85,193,195,0.12)]',
        disabled && !loading && 'opacity-40',
        dense ? 'pl-[18px]' : 'pl-5',
        'pr-1.5',
        className,
      )}
    >
      {live && <span className="vt-shine" aria-hidden />}
      {loading ? (
        <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-label="Loading" />
      ) : (
        <>
          <span className="min-w-0 flex-1 truncate text-left text-[14px] font-semibold leading-[1.2]">{label}</span>
          <span className={dense ? 'w-2.5' : 'w-3'} />
          <MarkTile mark={mark} />
        </>
      )}
    </button>
  );
}
