import { GlassCard } from '@/components/ui/GlassCard'
import { Text } from '@/components/ui/Text'
import { getAppTranslator } from '@/lib/i18n/appTranslator.adapter'
import { ITEMS_SUMMARY } from '@/screens/ItemsSummary/ItemsSummary.style'
import { loadItemsSummary } from '@/screens/ItemsSummary/loadItemsSummary.service'

const ItemsSummaryScreen = async () => {
  const { t } = await getAppTranslator()
  const summary = await loadItemsSummary()

  return (
    <GlassCard className={ITEMS_SUMMARY.CARD} padding="md" radius="lg">
      <Text as="p" className={ITEMS_SUMMARY.TITLE} variant="eyebrow">
        {t('items.summary.title')}
      </Text>
      <Text as="div" className={ITEMS_SUMMARY.ROW} variant="small">
        <span>
          <Text tone="primary" weight="semibold">
            {summary.totalCount}
          </Text>{' '}
          <Text tone="secondary">{t('items.summary.total')}</Text>
        </span>
        <span>
          <Text tone="success" weight="semibold">
            {summary.activeCount}
          </Text>{' '}
          <Text tone="secondary">{t('items.summary.active')}</Text>
        </span>
        <span>
          <Text tone="tertiary" weight="semibold">
            {summary.draftCount}
          </Text>{' '}
          <Text tone="secondary">{t('items.summary.draft')}</Text>
        </span>
        <span>
          <Text tone="tertiary" weight="semibold">
            {summary.archivedCount}
          </Text>{' '}
          <Text tone="secondary">{t('items.summary.archived')}</Text>
        </span>
      </Text>
    </GlassCard>
  )
}

export default ItemsSummaryScreen
