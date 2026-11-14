import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ShopFrame } from '@/components/shop/ShopFrame';

export const metadata: Metadata = {
  title: 'Vend IT - Machine',
  description: 'See what this Vend IT machine has and buy it without the app',
};

export default function MachineLayout({ children }: { children: ReactNode }) {
  return <ShopFrame>{children}</ShopFrame>;
}
