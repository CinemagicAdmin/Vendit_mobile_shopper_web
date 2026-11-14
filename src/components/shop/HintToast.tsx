'use client';

import { Info } from 'lucide-react';
import type { HintToastState } from '@/hooks/useHintToast';

export function HintToast({ toast }: { toast: HintToastState | null }) {
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[90px] z-[60] flex justify-center px-6" role="status">
      <div
        key={toast.id}
        className="vt-toast flex max-w-full items-center gap-2 rounded-[30px] bg-[rgba(11,11,11,0.92)] px-3.5 py-[9px] shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
      >
        <Info className="h-4 w-4 shrink-0 text-white" />
        <span className="truncate text-[13px] text-white">{toast.message}</span>
      </div>
    </div>
  );
}
