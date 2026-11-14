'use client';

import { MapPin } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { GuestQuote } from '@/types/guest-checkout';

interface PayMachineCardProps {
  machine: GuestQuote['machine'];
}

export function PayMachineCard({ machine }: PayMachineCardProps) {
  return (
    <div className="relative rounded-2xl p-[2px] overflow-hidden shadow-sm">
      <div
        className="absolute inset-[-50%] animate-[spin_4s_linear_infinite]"
        style={{
          background: 'conic-gradient(from 0deg, #4ECDC4, #a8edea, #4ECDC4, transparent, #4ECDC4)',
        }}
      />
      <div className="relative bg-white rounded-[14px] p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-[#2c3e50] flex items-center justify-center shrink-0">
          <span className="text-[#4ECDC4] font-bold text-lg">VT</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-gray-900 truncate">
            {machine.name ?? 'Vend IT machine'}
          </p>
          {machine.location && (
            <div className="flex items-center gap-1.5 text-gray-500 mt-0.5">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="text-sm truncate">{machine.location}</span>
            </div>
          )}
          <span
            className={cn(
              'inline-flex items-center gap-1.5 mt-1.5 text-xs font-semibold',
              machine.online ? 'text-[#2a9d95]' : 'text-gray-400',
            )}
          >
            <span
              className={cn('w-2 h-2 rounded-full', machine.online ? 'bg-[#4ECDC4]' : 'bg-gray-300')}
            />
            {machine.online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  );
}
