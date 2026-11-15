'use client';

import Image from 'next/image';
import { Gift, Sparkles, Tag, X, type LucideIcon } from 'lucide-react';
import { config } from '@/config/env';
import { useDismissed, usePlatform } from '@/hooks/useAppPromo';
import { storeLinksFor } from '@/utils/app-store';
import { cn } from '@/utils/cn';

export type PromoPlace = 'machine' | 'checkout' | 'collect';

const COPY: Record<PromoPlace, { title: string; body: string }> = {
  machine: {
    title: 'Get more with the Vend IT app',
    body: 'App-only offers, free gifts from brands and Vendos rewards when you shop.',
  },
  checkout: {
    title: 'Earn Vendos on orders like this',
    body: 'Pay in the Vend IT app to collect Vendos rewards and unlock app-only offers.',
  },
  collect: {
    title: 'Get rewarded next time',
    body: 'Shop with the Vend IT app to earn Vendos rewards and get app-only offers.',
  },
};

const PERKS: Array<{ label: string; icon: LucideIcon }> = [
  { label: 'Earn Vendos', icon: Sparkles },
  { label: 'App offers', icon: Tag },
  { label: 'Free gifts', icon: Gift },
];

function PerkChip({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-full bg-white/15 pe-2.5 ps-2 text-[11px] font-semibold">
      <Icon className="h-[13px] w-[13px]" aria-hidden />
      {label}
    </span>
  );
}

export function AppPromoBanner({ place, className }: { place: PromoPlace; className?: string }) {
  const { dismissed, dismiss } = useDismissed(place);
  const links = storeLinksFor(usePlatform(), { ios: config.iosStoreUrl, android: config.androidStoreUrl });
  if (dismissed || links.length === 0) return null;
  const copy = COPY[place];

  return (
    <section
      aria-label="Get the Vend IT app"
      className={cn(
        'vt-fade-in relative overflow-hidden rounded-2xl p-4 text-white',
        'bg-[linear-gradient(135deg,#1F6265_0%,#2D9295_55%,#55C1C3_100%)] shadow-[0_6px_16px_rgba(31,98,101,0.25)]',
        className,
      )}
    >
      <span aria-hidden className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
      <span aria-hidden className="pointer-events-none absolute -bottom-12 right-10 h-24 w-24 rounded-full bg-white/[0.07]" />
      <button
        type="button"
        onClick={dismiss}
        aria-label="Close"
        className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-white/80 active:bg-white/15"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="relative flex items-start gap-3 pe-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
          <Image src="/shop/app-logo.svg" alt="" width={28} height={17} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold leading-[1.25]">{copy.title}</h2>
          <p className="mt-1 text-[12px] leading-[1.45] text-white/85">{copy.body}</p>
        </div>
      </div>
      <div className="relative mt-3 flex flex-wrap gap-1.5">
        {PERKS.map((perk) => (
          <PerkChip key={perk.label} {...perk} />
        ))}
      </div>
      <div className="relative mt-3.5 flex gap-2">
        {links.map((link) => (
          <a
            key={link.store}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 flex-1 items-center justify-center rounded-[12px] bg-white text-[13px] font-semibold text-vt-press shadow-[0_2px_6px_rgba(0,0,0,0.12)] active:translate-y-px"
          >
            {link.label}
          </a>
        ))}
      </div>
    </section>
  );
}
