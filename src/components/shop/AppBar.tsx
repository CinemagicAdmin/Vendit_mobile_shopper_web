'use client';

import type { ReactNode } from 'react';
import { BackButton } from './BackButton';

interface AppBarProps {
  title: ReactNode;
  onBack?: () => void;
  actions?: ReactNode;
}

export function AppBar({ title, onBack, actions }: AppBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-vt-line bg-white">
      <div className="absolute left-3.5 flex items-center">{onBack && <BackButton onClick={onBack} />}</div>
      <h1 className="mx-auto max-w-[calc(100%-124px)] truncate text-[16px] font-semibold tracking-[-0.16px]">
        {title}
      </h1>
      <div className="absolute right-3 flex items-center">{actions}</div>
    </header>
  );
}
