'use client'

import { Chip } from '@/components/ui/Chip'
import { GlassCard } from '@/components/ui/GlassCard'
import { Text } from '@/components/ui/Text'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'
import { STATS_CARD } from '@/screens/ItemsDashboard/components/StatsCard/StatsCard.style'
import type { IStatsCardProps } from '@/screens/ItemsDashboard/components/StatsCard/StatsCard.type'

export const StatsCard = ({
  activeCount,
  isLoading,
  totalCount
}: IStatsCardProps) => {
  const { t } = useAppTranslator()

  return (
    <GlassCard>
      <div className={STATS_CARD.HEADER}>
        <span className={STATS_CARD.OVERVIEW_LABEL}>
          {t('items.dashboard.statsOverview')}
        </span>
        <Chip variant="success" withDot>
          {t('items.dashboard.statsLive')}
        </Chip>
      </div>
      <Text as="p" variant="amountHero">
        {isLoading ? '—' : totalCount}
      </Text>
      <p className={STATS_CARD.TOTAL_LABEL}>
        {t('items.dashboard.statsTotalItems')}
      </p>
      <div className={STATS_CARD.SUB_ROW}>
        <Chip variant="accent">
          {isLoading ? '—' : activeCount}{' '}
          {t('items.dashboard.statsActive')}
        </Chip>
        <span className={STATS_CARD.UPDATED_LABEL}>
          · {t('items.dashboard.statsUpdated')}
        </span>
      </div>
    </GlassCard>
  )
}
