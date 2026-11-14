'use client';

import { AlertCircle, Info } from 'lucide-react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorScreen } from '@/components/ui/ErrorScreen';
import { useGuestQuote } from '@/hooks/useGuestQuote';
import { useGuestPay } from '@/hooks/useGuestPay';
import { quoteErrorCopy } from '@/utils/guest-api-error';
import { PayMachineCard } from './PayMachineCard';
import { PayLineItems } from './PayLineItems';
import { PayActions } from './PayActions';
import { PayUnavailable } from './PayUnavailable';
import type { GuestBasket } from '@/types/guest-checkout';

function PayNotice({ tone, text }: { tone: 'error' | 'info'; text: string }) {
  const Icon = tone === 'error' ? AlertCircle : Info;
  const colors =
    tone === 'error'
      ? 'bg-red-50 border-red-200 text-red-700'
      : 'bg-[#e8faf9] border-[#a8edea] text-[#1f7a74]';
  return (
    <div role="status" className={`rounded-xl border p-3 flex gap-2 text-sm ${colors}`}>
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{text}</span>
    </div>
  );
}

export function GuestCheckout({ basket }: { basket: GuestBasket }) {
  const { state, refresh, retry } = useGuestQuote(basket);
  const { pending, error, priceNotice, pay } = useGuestPay(basket, refresh);

  if (state.kind === 'loading') return <LoadingScreen message="Loading your order..." />;

  if (state.kind === 'error') {
    const copy = quoteErrorCopy(state.error);
    return (
      <ErrorScreen
        title={copy.title}
        message={copy.message}
        onRetry={copy.canRetry ? retry : undefined}
      />
    );
  }

  const { quote } = state;
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#c8f0ec_0%,#e8faf9_30%,#f0fdfb_60%,#ffffff_100%)] px-4 pt-6 pb-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Your order</h1>
      <p className="text-sm text-gray-500 mb-4">Check your items, then pay to collect them.</p>
      <div className="space-y-4">
        <PayMachineCard machine={quote.machine} />
        <PayLineItems lines={quote.lines} total={quote.total} currency={quote.currency} />
        {error && <PayNotice tone="error" text={error} />}
        {priceNotice && <PayNotice tone="info" text={priceNotice} />}
        {quote.sellable ? (
          <PayActions quote={quote} pending={pending} onPay={(method) => void pay(method, quote)} />
        ) : (
          <PayUnavailable reason={quote.unavailableReason} />
        )}
      </div>
    </div>
  );
}
