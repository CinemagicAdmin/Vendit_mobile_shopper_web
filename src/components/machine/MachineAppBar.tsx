'use client';

import Image from 'next/image';
import { CircleX, Search } from 'lucide-react';
import { AppBar } from '@/components/shop/AppBar';

interface MachineAppBarProps {
  title: string | null;
  onBack?: () => void;
  searching: boolean;
  query: string;
  onQuery: (query: string) => void;
  onSearch: (open: boolean) => void;
}

function SearchField({ query, onQuery, onCancel }: { query: string; onQuery: (query: string) => void; onCancel: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2.5 border-b border-vt-line bg-white px-4">
      <label className="flex h-11 flex-1 items-center rounded-[22px] border-[1.5px] border-vt-primary bg-vt-sunken pl-3.5 pr-1.5">
        <Search className="h-5 w-5 shrink-0 text-vt-grey" />
        <input
          autoFocus
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search in this machine"
          aria-label="Search in this machine"
          className="ml-2 min-w-0 flex-1 bg-transparent text-[14px] text-black outline-none placeholder:text-vt-hint"
        />
        {query && (
          <button type="button" aria-label="Clear search" onClick={() => onQuery('')} className="flex h-8 w-8 items-center justify-center">
            <CircleX className="h-[18px] w-[18px] fill-vt-hint text-white" />
          </button>
        )}
      </label>
      <button type="button" onClick={onCancel} className="h-11 text-[13px] font-semibold text-vt-press">
        Cancel
      </button>
    </header>
  );
}

export function MachineAppBar({ title, onBack, searching, query, onQuery, onSearch }: MachineAppBarProps) {
  if (searching) return <SearchField query={query} onQuery={onQuery} onCancel={() => onSearch(false)} />;
  const titleNode = title ?? <span className="vt-shimmer-light inline-block h-3 w-[140px] rounded align-middle" />;
  return (
    <AppBar
      title={titleNode}
      onBack={onBack}
      actions={
        <button
          type="button"
          aria-label="Search in this machine"
          onClick={() => onSearch(true)}
          className="flex h-11 w-11 items-center justify-center"
        >
          <Image src="/shop/search.svg" alt="" width={24} height={24} unoptimized />
        </button>
      }
    />
  );
}
