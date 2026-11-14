'use client';

import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

type BtnVariant = 'primary' | 'outline' | 'neutral' | 'ghost';

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  loading?: boolean;
}

const VARIANTS: Record<BtnVariant, string> = {
  primary: 'bg-vt-primary text-white hover:bg-vt-hover active:bg-vt-press rounded-[15px]',
  outline: 'bg-white text-vt-primary border border-vt-primary rounded-[15px]',
  neutral: 'bg-white text-black border border-vt-border rounded-[16.8px]',
  ghost: 'bg-transparent text-vt-grey rounded-[15px]',
};

export const btnClass = (variant: BtnVariant = 'primary') =>
  cn(
    'inline-flex h-11 w-full items-center justify-center px-3 text-[13px] font-medium transition-[background-color,transform] duration-[90ms] ease-out active:translate-y-px focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(85,193,195,0.35)] disabled:opacity-40',
    VARIANTS[variant],
  );

export function Btn({ variant = 'primary', loading, disabled, className, children, ...props }: BtnProps) {
  return (
    <button type="button" className={cn(btnClass(variant), className)} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : children}
    </button>
  );
}
