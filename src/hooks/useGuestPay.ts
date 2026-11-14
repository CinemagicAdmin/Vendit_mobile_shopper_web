'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { guestCheckoutService } from '@/services/guest-checkout.service';
import { guestStorage } from '@/utils/guest-storage';
import { generateGuestSecret } from '@/utils/guest-secret';
import { submitGuestCheckout, type GuestSubmitDeps } from '@/utils/guest-submit';
import { formatMoney, roundMoney } from '@/utils/money';
import {
  checkoutErrorMessage,
  isPriceMismatch,
  toGuestApiError,
  type GuestApiError,
} from '@/utils/guest-api-error';
import type { GuestBasket, GuestPaymentMethod, GuestQuote } from '@/types/guest-checkout';

interface GuestPayState {
  pending: GuestPaymentMethod | null;
  error: string | null;
  priceNotice: string | null;
}

type RefreshQuote = () => Promise<GuestQuote | null>;

const IDLE: GuestPayState = { pending: null, error: null, priceNotice: null };
const REQUOTE_CODES = new Set(['MACHINE_OFFLINE', 'FEATURE_DISABLED']);

function submitDeps(basketKey: string): GuestSubmitDeps {
  return {
    create: guestCheckoutService.create,
    loadSecret: () => guestStorage.getPendingSecret(basketKey),
    saveSecret: (secret) => guestStorage.savePendingSecret(basketKey, secret),
    clearSecret: () => guestStorage.clearPendingSecret(basketKey),
    newSecret: generateGuestSecret,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  };
}

function safeCheckoutUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const plainHttpAllowed = window.location.protocol === 'http:';
    return url.protocol === 'https:' || (plainHttpAllowed && url.protocol === 'http:') ? url.href : null;
  } catch {
    return null;
  }
}

async function failureState(error: GuestApiError, refreshQuote: RefreshQuote): Promise<GuestPayState> {
  if (isPriceMismatch(error)) {
    const quote = await refreshQuote();
    if (quote) {
      const amount = formatMoney(quote.total, quote.currency);
      return { ...IDLE, priceNotice: `The price changed to ${amount}. Tap pay again to confirm.` };
    }
  } else if (error.status === 409 || REQUOTE_CODES.has(error.code ?? '')) {
    await refreshQuote();
  }
  return { ...IDLE, error: checkoutErrorMessage(error) };
}

export function useGuestPay(basket: GuestBasket, refreshQuote: RefreshQuote) {
  const router = useRouter();
  const inFlight = useRef(false);
  const [state, setState] = useState<GuestPayState>(IDLE);

  useEffect(() => {
    // Coming back from the payment page via the back button restores a frozen page with the button still locked.
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      inFlight.current = false;
      setState(IDLE);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const pay = async (method: GuestPaymentMethod, quote: GuestQuote) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setState({ ...IDLE, pending: method });
    const payload = {
      machineId: basket.machineId,
      products: basket.lines,
      amount: roundMoney(quote.total),
      paymentMethod: method,
    };
    try {
      const { secret, start } = await submitGuestCheckout(payload, submitDeps(basket.key));
      guestStorage.savePayment({
        secret,
        paymentId: start.paymentId,
        payUrl: `${window.location.pathname}${window.location.search}`,
        basketKey: basket.key,
        orderReference: start.orderReference,
      });
      const checkoutUrl = safeCheckoutUrl(start.checkoutUrl);
      if (checkoutUrl) window.location.assign(checkoutUrl);
      else router.replace(`/pay/return?paymentId=${encodeURIComponent(start.paymentId)}`);
    } catch (caught: unknown) {
      const next = await failureState(toGuestApiError(caught), refreshQuote);
      inFlight.current = false;
      setState(next);
    }
  };

  return { ...state, pay };
}
