'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HintToast } from '@/components/shop/HintToast';
import { useCanGoBack } from '@/hooks/useCanGoBack';
import { useCheckoutDraft } from '@/hooks/useCheckoutDraft';
import { useGuestPay } from '@/hooks/useGuestPay';
import { useGuestQuote } from '@/hooks/useGuestQuote';
import { useHintToast } from '@/hooks/useHintToast';
import { addOne, removeOne } from '@/utils/guest-cart';
import { checkoutView, machineUrl, quoteMatches } from '@/utils/guest-cart-url';
import { guestStorage } from '@/utils/guest-storage';
import { CheckoutEmpty, CheckoutError, CheckoutShell, CheckoutSkeleton } from './CheckoutParts';
import { PayWith, payMethods } from './PayActions';
import { PayBar } from './PayBar';
import { PayLineItems } from './PayLineItems';
import { PayMachineCard } from './PayMachineCard';
import { PayNotice } from './PayNotice';
import { PayUnavailable } from './PayUnavailable';
import type { GuestBasket, GuestPaymentMethod } from '@/types/guest-checkout';

export function GuestCheckout({ basket }: { basket: GuestBasket }) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const { state, refresh, retry } = useGuestQuote(basket);
  const { pending, error, priceNotice, pay } = useGuestPay(basket, refresh);
  const { toast, show } = useHintToast();
  const draft = useCheckoutDraft(basket);
  const [chosen, setChosen] = useState<GuestPaymentMethod | null>(null);

  const quote = state.kind === 'ready' ? state.quote : null;
  const fresh = quote !== null && !draft.editing && quoteMatches(quote, basket.lines);
  const machineId = quote?.machine.id ?? null;

  useEffect(() => {
    // The URL basket wins: the machine page reads this cart back.
    if (fresh && machineId) guestStorage.saveCart(machineId, basket.lines);
  }, [fresh, machineId, basket.lines]);

  if (state.kind === 'loading') return <CheckoutSkeleton />;
  if (state.kind === 'error') return <CheckoutError error={state.error} onRetry={retry} />;

  const ready = state.quote;
  const moreUrl = machineUrl(ready.machine.id);
  const view = checkoutView(ready, draft.lines);
  const methods = payMethods(ready.paymentMethods);
  const method = chosen && methods.includes(chosen) ? chosen : (methods[0] ?? null);
  const paying = pending !== null;
  const canPay = fresh && ready.sellable && method !== null && !paying;

  const increase = (productId: string) => {
    const change = addOne(draft.lines, productId, Number.POSITIVE_INFINITY);
    if (change.ok) draft.change(change.lines);
    else show(change.message);
  };
  const decrease = (productId: string) => {
    const next = removeOne(draft.lines, productId);
    if (next.length === 0) guestStorage.saveCart(ready.machine.id, []);
    draft.change(next);
  };

  return (
    <CheckoutShell onBack={canGoBack ? () => router.back() : undefined}>
      <div className="space-y-2.5">
        <PayMachineCard machine={ready.machine} />
        {draft.lines.length === 0 ? (
          <CheckoutEmpty moreUrl={moreUrl} />
        ) : (
          <>
            <PayLineItems
              lines={view.lines}
              currency={ready.currency}
              moreUrl={moreUrl}
              locked={paying}
              onIncrease={increase}
              onDecrease={decrease}
            />
            {error && <PayNotice tone="error" title="Payment not started">{error}</PayNotice>}
            {priceNotice && <PayNotice tone="info" title="Prices updated">{priceNotice}</PayNotice>}
            {ready.sellable || !fresh ? (
              <PayWith methods={methods} selected={method} onSelect={setChosen} disabled={paying} redirecting={paying} />
            ) : (
              <PayUnavailable reason={ready.unavailableReason} />
            )}
          </>
        )}
      </div>
      {draft.lines.length > 0 && (
        <PayBar
          units={view.units}
          total={view.total}
          currency={ready.currency}
          canPay={canPay}
          paying={paying}
          onPay={() => {
            if (method) void pay(method, ready);
          }}
        />
      )}
      <HintToast toast={toast} />
    </CheckoutShell>
  );
}
