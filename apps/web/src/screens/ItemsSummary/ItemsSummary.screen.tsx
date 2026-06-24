// Server Component — no 'use client'.
// Fetches a cached summary via getItemsSummary() ('use cache' + cacheLife/cacheTag)
// and renders a compact stat card. Mount this inside <Suspense> in page.tsx so
// the streaming shell is sent while the cached fetch resolves.

import { GlassCard } from '@/components/ui/GlassCard'
import { getItemsSummary } from '@/services/ItemsSummary'

const ItemsSummaryScreen = async () => {
  const summary = await getItemsSummary()

  return (
    <GlassCard className="mb-6" padding="md" radius="lg">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-secondary">
        Items Summary
      </p>
      <div className="flex gap-6 text-sm">
        <span>
          <span className="font-semibold text-text-primary">
            {summary.totalCount}
          </span>{' '}
          <span className="text-text-secondary">total</span>
        </span>
        <span>
          <span className="font-semibold text-accent-green">
            {summary.activeCount}
          </span>{' '}
          <span className="text-text-secondary">active</span>
        </span>
        <span>
          <span className="font-semibold text-text-muted">
            {summary.draftCount}
          </span>{' '}
          <span className="text-text-secondary">draft</span>
        </span>
        <span>
          <span className="font-semibold text-text-muted">
            {summary.archivedCount}
          </span>{' '}
          <span className="text-text-secondary">archived</span>
        </span>
      </div>
    </GlassCard>
  )
}

export default ItemsSummaryScreen
