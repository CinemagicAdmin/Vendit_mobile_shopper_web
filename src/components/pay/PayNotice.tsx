import type { ReactNode } from 'react';
import { CircleAlert, Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/utils/cn';

type NoticeTone = 'info' | 'warning' | 'error';

const TONES: Record<NoticeTone, { box: string; icon: string; Icon: typeof Info }> = {
  info: { box: 'bg-[rgba(221,164,78,0.1)] border-[rgba(221,164,78,0.45)]', icon: 'text-vt-yellow', Icon: Info },
  warning: { box: 'bg-[rgba(221,164,78,0.1)] border-[rgba(221,164,78,0.45)]', icon: 'text-vt-yellow', Icon: TriangleAlert },
  error: { box: 'bg-[rgba(224,81,81,0.08)] border-[rgba(224,81,81,0.4)]', icon: 'text-vt-danger', Icon: CircleAlert },
};

interface PayNoticeProps {
  tone: NoticeTone;
  title: string;
  children: ReactNode;
}

export function PayNotice({ tone, title, children }: PayNoticeProps) {
  const { box, icon, Icon } = TONES[tone];
  return (
    <div role="status" className={cn('flex gap-3 rounded-2xl border p-3', box)}>
      <Icon className={cn('h-[22px] w-[22px] shrink-0', icon)} />
      <div className="min-w-0">
        <p className="text-[14px] font-semibold leading-[1.2]">{title}</p>
        <p className="mt-1 text-[13px] leading-[1.4] text-vt-grey">{children}</p>
      </div>
    </div>
  );
}
