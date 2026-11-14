'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ShoppingBag } from 'lucide-react';
import { AppBar } from '@/components/shop/AppBar';
import { btnClass } from '@/components/shop/Btn';
import { EmptyStateView, FeatureErrorView } from '@/components/shop/FeatureErrorView';
import { quoteErrorCopy, type GuestApiError } from '@/utils/guest-api-error';
import { AppDownloadCta } from './AppDownloadCta';

const SKELETON = [
  { height: 110, gap: 0 },
  { height: 80, gap: 22 },
  { height: 68, gap: 10 },
  { height: 68, gap: 10 },
  { height: 68, gap: 22 },
  { height: 68, gap: 10 },
];

export function CheckoutShell({ onBack, children }: { onBack?: () => void; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppBar title="Checkout" onBack={onBack} />
      <div className="px-5 pb-36 pt-4">{children}</div>
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <CheckoutShell>
      <div aria-busy="true" aria-label="Loading your order">
        {SKELETON.map((block, index) => (
          <div
            key={index}
            className="vt-shimmer rounded-2xl opacity-60"
            style={{ height: block.height, marginTop: block.gap }}
          />
        ))}
      </div>
    </CheckoutShell>
  );
}

export function CheckoutError({ error, onRetry }: { error: GuestApiError; onRetry: () => void }) {
  const copy = quoteErrorCopy(error);
  const icon = error.status === 404 ? 'missing' : error.status === 0 ? 'offline' : 'error';
  return (
    <CheckoutShell>
      <FeatureErrorView icon={icon} title={copy.title} message={copy.message} onRetry={copy.canRetry ? onRetry : undefined}>
        {!copy.canRetry && <AppDownloadCta />}
      </FeatureErrorView>
    </CheckoutShell>
  );
}

export function CheckoutEmpty({ moreUrl }: { moreUrl: string }) {
  return (
    <EmptyStateView
      icon={<ShoppingBag className="h-12 w-12 text-vt-muted" strokeWidth={1.6} />}
      title="Your cart is empty"
      message="Add products from this machine to get started."
      action={
        <Link href={moreUrl} className={`${btnClass('primary')} text-[14px]`}>
          Browse products
        </Link>
      }
    />
  );
}
