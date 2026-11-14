'use client';

import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatMoney } from '@/utils/money';
import type { GuestPaymentMethod, GuestQuote } from '@/types/guest-checkout';

interface PayActionsProps {
  quote: GuestQuote;
  pending: GuestPaymentMethod | null;
  onPay: (method: GuestPaymentMethod) => void;
}

const SPECIFIC_METHODS: GuestPaymentMethod[] = ['KNET', 'CARD'];

function buttonMethods(available: GuestPaymentMethod[]): GuestPaymentMethod[] {
  if (available.includes('ALL')) return ['ALL'];
  return SPECIFIC_METHODS.filter((method) => available.includes(method));
}

function buttonLabel(method: GuestPaymentMethod, amount: string): string {
  if (method === 'KNET') return `Pay ${amount} with KNET`;
  if (method === 'CARD') return `Pay ${amount} by card`;
  return `Pay ${amount}`;
}

export function PayActions({ quote, pending, onPay }: PayActionsProps) {
  const methods = buttonMethods(quote.paymentMethods);
  const amount = formatMoney(quote.total, quote.currency);

  if (methods.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center">
        Paying on the web is not available for this machine right now.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {methods.map((method, index) => (
        <Button
          key={method}
          variant={index === 0 ? 'primary' : 'outline'}
          loading={pending === method}
          disabled={pending !== null}
          onClick={() => onPay(method)}
        >
          {buttonLabel(method, amount)}
        </Button>
      ))}
      {pending && (
        <p className="text-sm text-gray-500 text-center">Taking you to the secure payment page...</p>
      )}
      <p className="flex items-start justify-center gap-1.5 text-xs text-gray-400 text-center px-2">
        <Lock className="h-3.5 w-3.5 shrink-0 mt-px" />
        <span>You pay as a guest. Your items drop from this machine once payment completes.</span>
      </p>
    </div>
  );
}
