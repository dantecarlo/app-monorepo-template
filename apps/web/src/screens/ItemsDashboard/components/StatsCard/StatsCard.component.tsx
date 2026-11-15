'use client'

import { useTranslations } from 'next-intl'

import { Chip } from '@/components/ui/Chip'
import { GlassCard } from '@/components/ui/GlassCard'
import { Text } from '@/components/ui/Text'
import { STATS_CARD } from '@/screens/ItemsDashboard/components/StatsCard/StatsCard.style'
import type { IStatsCardProps } from '@/screens/ItemsDashboard/components/StatsCard/StatsCard.type'

export const StatsCard = ({
  activeCount,
  isLoading,
  totalCount
}: IStatsCardProps) => {
  const t = useTranslations('items.dashboard')

  return (
    <GlassCard>
      <div className={STATS_CARD.HEADER}>
        <span className={STATS_CARD.OVERVIEW_LABEL}>
          {t('statsOverview')}
        </span>
        <Chip variant="success" withDot>
          {t('statsLive')}
        </Chip>
      </div>
      <Text as="p" variant="amountHero">
        {isLoading ? '—' : totalCount}
      </Text>
      <p className={STATS_CARD.TOTAL_LABEL}>{t('statsTotalItems')}</p>
      <div className={STATS_CARD.SUB_ROW}>
        <Chip variant="accent">
          {isLoading ? '—' : activeCount} {t('statsActive')}
        </Chip>
        <span className={STATS_CARD.UPDATED_LABEL}>
          · {t('statsUpdated')}
        </span>
      </div>
    </GlassCard>
  )
}
