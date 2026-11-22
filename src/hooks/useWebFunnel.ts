'use client';

import { useEffect } from 'react';
import { guestCheckoutService } from '@/services/guest-checkout.service';
import { firstTimeThisVisit, trackOncePerVisit, webVisitorIds } from '@/services/web-funnel';
import { guestStorage } from '@/utils/guest-storage';
import type { WebEventType } from '@/utils/web-funnel';

/** Records a page event once per visit per machine; a null machine id records nothing yet. */
export function useMachineEventOnce(type: WebEventType, machineId: string | null): void {
  useEffect(() => {
    if (machineId) trackOncePerVisit(`${type}:${machineId}`, type, { machineId });
  }, [type, machineId]);
}

function linkCheckoutToVisitor(paymentId: string): void {
  try {
    const secret = guestStorage.getPayment(paymentId)?.secret;
    if (!secret || !firstTimeThisVisit(`checkout_link:${paymentId}`)) return;
    void guestCheckoutService.linkVisitor(secret, { ...webVisitorIds(), paymentId }).catch(() => undefined);
  } catch {
    // Attribution never touches the order page.
  }
}

/** Once the order has loaded, proves it with the guest secret so the server ties it to this visitor. */
export function useCheckoutLink(paymentId: string | null, loaded: boolean): void {
  useEffect(() => {
    if (paymentId && loaded) linkCheckoutToVisitor(paymentId);
  }, [paymentId, loaded]);
}
