import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Vend IT - Pay',
  description: 'Pay for your Vend IT order and collect it from the machine',
};

export default function PayLayout({ children }: { children: ReactNode }) {
  return children;
}
