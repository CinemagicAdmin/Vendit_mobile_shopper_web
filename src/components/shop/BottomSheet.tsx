'use client';

import { useEffect, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface BottomSheetProps {
  label: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function GrabHandle({ strong }: { strong?: boolean }) {
  return (
    <div className="flex h-5 items-center justify-center">
      <span className={cn('h-1 w-8 rounded-sm', strong ? 'bg-[rgba(73,69,79,0.4)]' : 'bg-[rgba(73,69,79,0.25)]')} />
    </div>
  );
}

export function BottomSheet({ label, onClose, children, className }: BottomSheetProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={label}>
      <button type="button" aria-label="Close" onClick={onClose} className="vt-fade-in absolute inset-0 bg-black/40" />
      <div
        className={cn(
          'vt-sheet-up absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-[20px] bg-white px-5 pb-[max(env(safe-area-inset-bottom),12px)]',
          className,
        )}
      >
        <GrabHandle />
        {children}
      </div>
    </div>
  );
}
