'use client';

import { Smartphone } from 'lucide-react';
import { config } from '@/config/env';
import { btnClass } from '@/components/shop/Btn';
import { usePlatform } from '@/hooks/useAppPromo';
import { storeUrlFor } from '@/utils/app-store';
import { cn } from '@/utils/cn';

interface AppDownloadCtaProps {
  message?: string;
  bare?: boolean;
}

const DEFAULT_MESSAGE = 'Pay at any machine in a few taps and keep track of your orders.';

export function AppDownloadCta({ message = DEFAULT_MESSAGE, bare }: AppDownloadCtaProps) {
  const { iosStoreUrl, androidStoreUrl, appName } = config;
  const storeUrl = storeUrlFor(usePlatform(), { ios: iosStoreUrl, android: androidStoreUrl });

  return (
    <div className={cn('text-left', !bare && 'rounded-2xl bg-white p-3 shadow-[0_0_8px_rgba(221,235,249,0.8)]')}>
      <div className="flex items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[rgba(85,193,195,0.1)]">
          <Smartphone className="h-[22px] w-[22px] text-vt-press" />
        </span>
        <div className="ml-3 min-w-0">
          <p className="text-[14px] font-semibold leading-[1.2]">Get the {appName} app</p>
          <p className="mt-[3px] text-[12px] leading-[1.4] text-vt-grey">
            {storeUrl ? message : `${message} Search for ${appName} on the App Store or Google Play.`}
          </p>
        </div>
      </div>
      {storeUrl && (
        <a href={storeUrl} target="_blank" rel="noopener noreferrer" className={cn(btnClass('outline'), 'mt-3')}>
          Get the app
        </a>
      )}
    </div>
  );
}
