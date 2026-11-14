'use client';

import { CreditCard, Lock } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { GuestPaymentMethod } from '@/types/guest-checkout';

const SPECIFIC_METHODS: GuestPaymentMethod[] = ['KNET', 'CARD'];

const TITLES: Record<GuestPaymentMethod, string> = {
  ALL: 'Card, KNET or Apple Pay',
  KNET: 'KNET',
  CARD: 'Card',
};

export function payMethods(available: GuestPaymentMethod[]): GuestPaymentMethod[] {
  if (available.includes('ALL')) return ['ALL'];
  return SPECIFIC_METHODS.filter((method) => available.includes(method));
}

export function methodTitle(method: GuestPaymentMethod): string {
  return TITLES[method];
}

interface PayWithProps {
  methods: GuestPaymentMethod[];
  selected: GuestPaymentMethod | null;
  onSelect: (method: GuestPaymentMethod) => void;
  disabled: boolean;
  redirecting: boolean;
}

function Radio({ on }: { on: boolean }) {
  return (
    <span className={cn('flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2', on ? 'border-vt-primary' : 'border-vt-muted')}>
      <span className={cn('h-2.5 w-2.5 rounded-full bg-vt-primary transition-transform duration-[140ms]', on ? 'scale-100' : 'scale-0')} />
    </span>
  );
}

export function PayWith({ methods, selected, onSelect, disabled, redirecting }: PayWithProps) {
  if (methods.length === 0) {
    return <p className="px-1 text-[13px] text-vt-grey">Paying on the web is not available for this machine right now.</p>;
  }
  return (
    <section className="pt-1.5" aria-label="Pay with">
      <h2 className="px-1 text-[15px] font-semibold">Pay with</h2>
      <div className="mt-2.5 space-y-2.5" role="radiogroup">
        {methods.map((method) => {
          const on = method === selected;
          return (
            <button
              key={method}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={disabled}
              onClick={() => onSelect(method)}
              className={cn(
                'flex w-full items-center rounded-2xl border-[1.5px] bg-white p-3 text-left shadow-[0_0_8px_rgba(221,235,249,0.8)] transition-colors duration-[140ms]',
                on ? 'border-vt-primary' : 'border-transparent',
              )}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[rgba(85,193,195,0.1)]">
                <CreditCard className="h-[22px] w-[22px] text-vt-press" />
              </span>
              <span className="ml-3 min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold leading-[1.2]">{methodTitle(method)}</span>
                <span className="mt-[3px] block text-[12px] text-vt-grey">On a secure payment page</span>
              </span>
              <span className="ml-2">
                <Radio on={on} />
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 flex items-start gap-1.5 px-1 text-[12px] leading-[1.4] text-vt-grey">
        <Lock className="mt-px h-3.5 w-3.5 shrink-0" />
        <span>
          {redirecting
            ? 'Taking you to the secure payment page...'
            : 'You pay as a guest. Your items drop from this machine once payment completes.'}
        </span>
      </p>
    </section>
  );
}
