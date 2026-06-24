'use client'

import { useTranslations } from 'next-intl'

import { Chip } from '@/components/ui/Chip'
import { GlassCard } from '@/components/ui/GlassCard'
import { TEXT } from '@/helpers/style.constant'
import { STATS_CARD } from '@/screens/ItemsDashboard/components/StatsCard/StatsCard.styles'

export interface IStatsCardProps {
  activeCount: number
  isLoading: boolean
  totalCount: number
}

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
      <p className={TEXT.AMOUNT_HERO}>{isLoading ? '—' : totalCount}</p>
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
