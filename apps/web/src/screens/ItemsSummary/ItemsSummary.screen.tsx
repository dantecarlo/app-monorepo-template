import { getTranslations } from 'next-intl/server'

import { GlassCard } from '@/components/ui/GlassCard'
import { ITEMS_SUMMARY } from '@/screens/ItemsSummary/ItemsSummary.styles'
import { loadItemsSummary } from '@/screens/ItemsSummary/loadItemsSummary.service'

const ItemsSummaryScreen = async () => {
  const t = await getTranslations('items.summary')
  const summary = await loadItemsSummary()

  return (
    <GlassCard className={ITEMS_SUMMARY.CARD} padding="md" radius="lg">
      <p className={ITEMS_SUMMARY.TITLE}>{t('title')}</p>
      <div className={ITEMS_SUMMARY.ROW}>
        <span>
          <span className={ITEMS_SUMMARY.TOTAL_VALUE}>
            {summary.totalCount}
          </span>{' '}
          <span className={ITEMS_SUMMARY.LABEL}>{t('total')}</span>
        </span>
        <span>
          <span className={ITEMS_SUMMARY.ACTIVE_VALUE}>
            {summary.activeCount}
          </span>{' '}
          <span className={ITEMS_SUMMARY.LABEL}>{t('active')}</span>
        </span>
        <span>
          <span className={ITEMS_SUMMARY.DRAFT_VALUE}>
            {summary.draftCount}
          </span>{' '}
          <span className={ITEMS_SUMMARY.LABEL}>{t('draft')}</span>
        </span>
        <span>
          <span className={ITEMS_SUMMARY.DRAFT_VALUE}>
            {summary.archivedCount}
          </span>{' '}
          <span className={ITEMS_SUMMARY.LABEL}>{t('archived')}</span>
        </span>
      </div>
    </GlassCard>
  )
}

export default ItemsSummaryScreen
