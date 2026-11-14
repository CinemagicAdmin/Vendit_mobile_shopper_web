import type { ReactNode } from 'react';
import { Rubik } from 'next/font/google';
import '@/styles/shop.css';

const rubik = Rubik({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' });

export function ShopFrame({ children }: { children: ReactNode }) {
  return <div className={`${rubik.className} vt-shop min-h-screen bg-vt-page text-black`}>{children}</div>;
}
