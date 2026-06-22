'use client';

import { useMemo, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { ItemCard } from '@/features/items/components/ItemCard.component';
import { useItems } from '@/features/items/hooks/useItems.hook';
import { TEXT, LAYOUT, GLASS } from '@/helpers/style.constant';

// ---------------------------------------------------------------------------
// Nav items
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'list',
    label: 'Items',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    id: 'search',
    label: 'Search',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
] as const;

type NavItemId = (typeof NAV_ITEMS)[number]['id'];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DashboardHeader() {
  return (
    <header className="flex items-center justify-between">
      {/* Wordmark */}
      <div className="flex items-center gap-3">
        <div
          className={[
            'flex h-9 w-9 items-center justify-center rounded-md',
            'bg-accent-gradient shadow-accent-glow',
            'font-display text-heading font-extrabold text-accent-ink',
          ].join(' ')}
          aria-label="App"
        >
          A
        </div>
        <div>
          <p className="font-body text-caption text-text-secondary">Welcome back</p>
          <p className={TEXT.TITLE}>Dashboard</p>
        </div>
      </div>

      {/* Settings icon button */}
      <button
        className={[
          'flex h-10 w-10 items-center justify-center rounded-full',
          'glass-card text-text-secondary',
          'hover:text-text-primary transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        ].join(' ')}
        aria-label="Settings"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </header>
  );
}

interface StatsCardProps {
  totalCount: number;
  activeCount: number;
  isLoading: boolean;
}

function StatsCard({ totalCount, activeCount, isLoading }: StatsCardProps) {
  return (
    <GlassCard>
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between">
        <span className="font-body text-label font-medium text-text-secondary">Overview</span>
        <Chip variant="success" withDot>
          Live
        </Chip>
      </div>

      {/* Hero stat */}
      <p className={TEXT.AMOUNT_HERO}>
        {isLoading ? '—' : totalCount}
      </p>
      <p className="mt-1 font-body text-label text-text-secondary">total items</p>

      {/* Sub-row */}
      <div className="mt-3 flex items-center gap-2">
        <Chip variant="accent">{isLoading ? '—' : activeCount} active</Chip>
        <span className="font-body text-caption text-text-tertiary">· updated just now</span>
      </div>
    </GlassCard>
  );
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-text-tertiary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search items…"
        className={[
          'w-full rounded-xl pl-10 pr-4 py-3',
          'glass-card',
          'font-body text-body text-text-primary placeholder:text-text-tertiary',
          'focus:outline-none focus:ring-2 focus:ring-accent',
          'transition-colors',
        ].join(' ')}
      />
    </div>
  );
}

interface ItemsListCardProps {
  items: ReturnType<typeof useItems>['data'];
  isLoading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
}

function ItemsListCard({ items = [], isLoading, search, onSearchChange }: ItemsListCardProps) {
  return (
    <GlassCard padding="none">
      {/* Card header */}
      <div className={`flex flex-col gap-3 ${GLASS.CARD_PADDING}`}>
        <div className="flex items-center justify-between">
          <span className={TEXT.TITLE}>Items</span>
          <span className="font-body text-caption text-text-tertiary">
            {isLoading ? '…' : `${items.length} results`}
          </span>
        </div>
        <SearchBar value={search} onChange={onSearchChange} />
      </div>

      {/* Item rows */}
      <div className={`px-5 pb-2 ${isLoading ? 'animate-pulse' : ''}`}>
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-3 border-t border-white/[0.06] first:border-t-0"
              >
                <div className="h-9 w-9 rounded-full bg-white/10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-40 rounded bg-white/10" />
                  <div className="h-3 w-24 rounded bg-white/[0.06]" />
                </div>
                <div className="h-4 w-12 rounded bg-white/10" />
              </div>
            ))
          : items.length === 0
          ? (
              <p className="py-6 text-center font-body text-body text-text-tertiary">
                No items found.
              </p>
            )
          : items.map((item) => <ItemCard key={item.id} item={item} />)}
      </div>
    </GlassCard>
  );
}

function FloatingNav({
  activeItem,
  onNavChange,
}: {
  activeItem: NavItemId;
  onNavChange: (id: NavItemId) => void;
}) {
  return (
    <nav
      className={[
        'fixed bottom-6 left-1/2 -translate-x-1/2',
        'glass-card rounded-full px-6 py-3',
        'flex items-center gap-6',
        'z-50',
      ].join(' ')}
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === activeItem;
        return (
          <button
            key={item.id}
            onClick={() => onNavChange(item.id)}
            className={[
              'flex flex-col items-center gap-0.5',
              'font-body text-caption',
              isActive ? 'text-accent' : 'text-text-tertiary',
              'hover:text-text-secondary transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded',
            ].join(' ')}
            aria-current={isActive ? 'page' : undefined}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function ItemsDashboard() {
  const [search, setSearch] = useState('');
  const [activeNav, setActiveNav] = useState<NavItemId>('home');

  const { data: items = [], isLoading } = useItems({ search });

  const summary = useMemo(() => {
    const activeCount = items.filter((i) => i.status === 'active').length;
    return {
      totalCount: items.length,
      activeCount,
    };
  }, [items]);

  return (
    <div className={`${LAYOUT.SCREEN} ${LAYOUT.CONTENT_AREA}`}>
      <main className={`${LAYOUT.MAX_WIDTH} ${LAYOUT.SCREEN_PADDING} pb-32 pt-12`}>
        <div className={LAYOUT.SECTION_GAP}>
          <DashboardHeader />

          <StatsCard
            totalCount={summary.totalCount}
            activeCount={summary.activeCount}
            isLoading={isLoading}
          />

          <ItemsListCard
            items={items}
            isLoading={isLoading}
            search={search}
            onSearchChange={setSearch}
          />

          <Button fullWidth variant="primary" className="mt-2">
            View all items
          </Button>
        </div>
      </main>

      <FloatingNav activeItem={activeNav} onNavChange={setActiveNav} />
    </div>
  );
}
