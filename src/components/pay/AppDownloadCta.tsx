'use client';

import { Smartphone } from 'lucide-react';
import { config } from '@/config/env';

const linkClass =
  'flex-1 rounded-xl border-2 border-[#4ECDC4] text-[#2a9d95] font-semibold text-sm py-2.5 text-center';

export function AppDownloadCta() {
  const { iosStoreUrl, androidStoreUrl } = config;
  if (!iosStoreUrl && !androidStoreUrl) return null;

  return (
    <div className="rounded-2xl bg-white shadow-sm p-4 text-center">
      <div className="w-12 h-12 rounded-full bg-[#e8faf9] flex items-center justify-center mx-auto mb-3">
        <Smartphone className="h-6 w-6 text-[#4ECDC4]" />
      </div>
      <p className="font-bold text-gray-900">Get the {config.appName} app</p>
      <p className="text-sm text-gray-500 mt-1 mb-4">
        Pay at any machine in a few taps and keep track of your orders.
      </p>
      <div className="flex gap-3">
        {iosStoreUrl && (
          <a href={iosStoreUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
            App Store
          </a>
        )}
        {androidStoreUrl && (
          <a href={androidStoreUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
            Google Play
          </a>
        )}
      </div>
    </div>
  );
}
