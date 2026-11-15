'use client';

import { AppBar } from '@/components/shop/AppBar';
import { FeatureErrorView, type FeatureErrorIcon } from '@/components/shop/FeatureErrorView';
import { MachineHeroSkeleton } from '@/components/shop/MachineHeroCard';
import { AppPromoBanner } from '@/components/shop/AppPromoBanner';
import { useGuestMenu } from '@/hooks/useGuestMenu';
import type { GuestApiError } from '@/utils/guest-api-error';
import { CategoryChipsShimmer } from './CategoryChips';
import { MachineShelf } from './MachineShelf';
import { ProductGridShimmer } from './ProductGrid';

interface MenuErrorCopy {
  icon: FeatureErrorIcon;
  title: string;
  message: string;
  canRetry: boolean;
}

function menuErrorCopy(error: GuestApiError): MenuErrorCopy {
  if (error.status === 404 || error.status === 400) {
    return {
      icon: 'missing',
      title: 'Machine not found',
      message: 'We could not find this machine. Please scan the QR code on the machine again.',
      canRetry: false,
    };
  }
  if (error.status === 0) {
    return { icon: 'offline', title: "You're offline", message: 'Check your connection and try again.', canRetry: true };
  }
  return {
    icon: 'error',
    title: 'Something went wrong',
    message: 'We could not load this machine. Please try again.',
    canRetry: true,
  };
}

function MachineSkeleton() {
  return (
    <div className="min-h-screen" aria-busy="true">
      <AppBar title={<span className="vt-shimmer-light inline-block h-3 w-[140px] rounded align-middle" />} />
      <div className="bg-white px-5 pb-2.5 pt-3">
        <MachineHeroSkeleton />
      </div>
      <CategoryChipsShimmer />
      <ProductGridShimmer />
    </div>
  );
}

export function MachineScreen({ machineId, productKey }: { machineId: string; productKey: string | null }) {
  const { state, retry } = useGuestMenu(machineId);
  if (state.kind === 'loading') return <MachineSkeleton />;
  if (state.kind === 'error') {
    const copy = menuErrorCopy(state.error);
    return (
      <div className="px-5">
        <FeatureErrorView icon={copy.icon} title={copy.title} message={copy.message} onRetry={copy.canRetry ? retry : undefined}>
          {!copy.canRetry && <AppPromoBanner place="general" />}
        </FeatureErrorView>
      </div>
    );
  }
  return <MachineShelf menu={state.menu} productKey={productKey} />;
}
