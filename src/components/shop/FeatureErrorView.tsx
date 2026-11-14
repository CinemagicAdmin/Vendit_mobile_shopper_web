'use client';

import type { ReactNode } from 'react';
import { CircleAlert, Info, SearchX, WifiOff } from 'lucide-react';
import { Btn } from './Btn';

export type FeatureErrorIcon = 'offline' | 'error' | 'info' | 'missing';

const ICONS = { offline: WifiOff, error: CircleAlert, info: Info, missing: SearchX };

interface FeatureErrorViewProps {
  icon?: FeatureErrorIcon;
  title: string;
  message: string;
  onRetry?: () => void;
  children?: ReactNode;
}

export function FeatureErrorView({ icon = 'error', title, message, onRetry, children }: FeatureErrorViewProps) {
  const Icon = ICONS[icon];
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <Icon className="h-12 w-12 text-vt-grey" strokeWidth={1.8} />
      <h2 className="mt-4 text-[17px] font-semibold leading-[1.2]">{title}</h2>
      <p className="mt-2 max-w-[300px] text-[14px] leading-[1.5] text-vt-grey">{message}</p>
      {onRetry && (
        <Btn className="mt-6 w-[180px] text-[14px]" onClick={onRetry}>
          Try again
        </Btn>
      )}
      {children && <div className="mt-6 w-full">{children}</div>}
    </div>
  );
}

interface EmptyStateViewProps {
  title: string;
  message: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyStateView({ title, message, action, icon }: EmptyStateViewProps) {
  return (
    <div className="flex flex-col items-center px-8 py-12 text-center">
      {icon}
      <h2 className="mt-4 text-[18px] font-bold">{title}</h2>
      <p className="mt-2 max-w-[300px] text-[13px] leading-[1.5] text-vt-grey">{message}</p>
      {action && <div className="mt-6 w-[200px]">{action}</div>}
    </div>
  );
}
