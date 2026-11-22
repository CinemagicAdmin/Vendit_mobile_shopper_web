'use client';

import Link from 'next/link';
import { AppPromoBanner } from '@/components/shop/AppPromoBanner';
import { btnClass } from '@/components/shop/Btn';
import { machineUrl } from '@/utils/guest-cart-url';
import {
  currentItem,
  dispenseRows,
  ringFraction,
  ringHeadline,
  totalUnitsOf,
  type RingPhase,
} from '@/utils/dispense-progress';
import { DispenseItems } from './DispenseItems';
import { DispenseRing } from './DispenseRing';
import type { GuestViewState } from '@/utils/guest-view-state';
import type { OrderInfo } from './OrderStatusView';

interface DispenseViewProps {
  view: GuestViewState;
  order: OrderInfo;
  connectionIssue: boolean;
}

function phaseOf(view: GuestViewState): RingPhase {
  if (view.kind === 'completed') return 'done';
  return view.kind === 'dispensing' ? 'dispensing' : 'preparing';
}

export function DispenseView({ view, order, connectionIssue }: DispenseViewProps) {
  const phase = phaseOf(view);
  const total = totalUnitsOf(order.items, view.totalUnits);
  const confirmed = view.confirmedUnits;
  const headline = ringHeadline(phase, confirmed, total, order.machineName);
  const done = phase === 'done';
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex-1 px-5 pb-5 pt-8">
        <DispenseRing
          fraction={ringFraction(confirmed, view.totalUnits, phase)}
          done={done}
          item={currentItem(order.items, confirmed)}
        />
        <h1 className="mt-5 text-center text-[20px] font-bold tracking-[-0.2px]">{headline.title}</h1>
        <p className="mx-auto mt-1.5 max-w-[300px] text-center text-[13px] leading-[1.45] text-vt-grey" aria-live="polite">
          {headline.subtitle}
        </p>
        {connectionIssue && !done && (
          <p className="mt-2 text-center text-[12px] text-vt-yellow">Your connection looks unstable. Still checking...</p>
        )}
        <div className="mt-6">
          <DispenseItems rows={dispenseRows(order.items, confirmed, phase)} />
        </div>
        {done && <AppPromoBanner place="collect" machineId={order.machineId} className="mt-6" />}
      </div>
      {done && order.machineId && (
        <footer className="vt-fade-in sticky bottom-0 bg-white px-5 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
          <Link href={machineUrl(order.machineId)} className={btnClass('neutral')}>
            Done
          </Link>
        </footer>
      )}
    </div>
  );
}
