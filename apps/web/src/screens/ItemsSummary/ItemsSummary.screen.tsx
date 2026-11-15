import { getTranslations } from 'next-intl/server'

import { GlassCard } from '@/components/ui/GlassCard'
import { Text } from '@/components/ui/Text'
import { ITEMS_SUMMARY } from '@/screens/ItemsSummary/ItemsSummary.style'
import { loadItemsSummary } from '@/screens/ItemsSummary/loadItemsSummary.service'

const ItemsSummaryScreen = async () => {
  const t = await getTranslations('items.summary')
  const summary = await loadItemsSummary()

  return (
    <GlassCard className={ITEMS_SUMMARY.CARD} padding="md" radius="lg">
      <Text as="p" className={ITEMS_SUMMARY.TITLE} variant="eyebrow">
        {t('title')}
      </Text>
      <Text as="div" className={ITEMS_SUMMARY.ROW} variant="small">
        <span>
          <Text tone="primary" weight="semibold">
            {summary.totalCount}
          </Text>{' '}
          <Text tone="secondary">{t('total')}</Text>
        </span>
        <span>
          <Text tone="success" weight="semibold">
            {summary.activeCount}
          </Text>{' '}
          <Text tone="secondary">{t('active')}</Text>
        </span>
        <span>
          <Text tone="tertiary" weight="semibold">
            {summary.draftCount}
          </Text>{' '}
          <Text tone="secondary">{t('draft')}</Text>
        </span>
        <span>
          <Text tone="tertiary" weight="semibold">
            {summary.archivedCount}
          </Text>{' '}
          <Text tone="secondary">{t('archived')}</Text>
        </span>
      </Text>
    </GlassCard>
  )
}

export default ItemsSummaryScreen
