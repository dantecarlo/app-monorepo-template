import { getTranslations } from 'next-intl/server'

import { GlassCard } from '@/components/ui/GlassCard'
import { getItemsSummary } from '@/services/ItemsSummary'

const ItemsSummaryScreen = async () => {
  const t = await getTranslations('items.summary')
  const summary = await getItemsSummary()

  return (
    <GlassCard className="mb-6" padding="md" radius="lg">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-secondary">
        {t('title')}
      </p>
      <div className="flex gap-6 text-sm">
        <span>
          <span className="font-semibold text-text-primary">
            {summary.totalCount}
          </span>{' '}
          <span className="text-text-secondary">{t('total')}</span>
        </span>
        <span>
          <span className="font-semibold text-success">
            {summary.activeCount}
          </span>{' '}
          <span className="text-text-secondary">{t('active')}</span>
        </span>
        <span>
          <span className="font-semibold text-text-tertiary">
            {summary.draftCount}
          </span>{' '}
          <span className="text-text-secondary">{t('draft')}</span>
        </span>
        <span>
          <span className="font-semibold text-text-tertiary">
            {summary.archivedCount}
          </span>{' '}
          <span className="text-text-secondary">{t('archived')}</span>
        </span>
      </div>
    </GlassCard>
  )
}

export default ItemsSummaryScreen
