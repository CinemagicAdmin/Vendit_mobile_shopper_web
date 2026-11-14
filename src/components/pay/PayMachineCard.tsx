'use client';

import { MachineHeroCard } from '@/components/shop/MachineHeroCard';
import type { GuestQuote } from '@/types/guest-checkout';

export function PayMachineCard({ machine }: { machine: GuestQuote['machine'] }) {
  return <MachineHeroCard name={machine.name ?? machine.location ?? 'Vend IT machine'} location={machine.location} imageUrl={machine.imageUrl ?? null} />;
}
