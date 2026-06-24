import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'

import { GlassCard } from '@/components/ui/GlassCard'
import { TEXT } from '@/helpers/style.constant'
import { STATS_CARD_STYLES as styles } from '@/screens/ItemsDashboard/components/StatsCard/StatsCard.styles'

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
  const { t } = useTranslation('translation', {
    keyPrefix: 'items.dashboard'
  })

  return (
    <GlassCard padding="lg" radius="xl">
      <View style={styles.headerRow}>
        <Text style={TEXT.label}>{t('statsOverview')}</Text>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={[TEXT.caption, styles.livePillText]}>
            {t('statsLive')}
          </Text>
        </View>
      </View>

      <Text style={TEXT.amountHero}>{isLoading ? '—' : totalCount}</Text>
      <Text style={[TEXT.label, styles.statsLabel]}>
        {t('statsTotalItems')}
      </Text>

      <View style={styles.subRow}>
        <View style={styles.activePill}>
          <Text style={[TEXT.caption, styles.activePillText]}>
            {isLoading ? '—' : activeCount} {t('statsActive')}
          </Text>
        </View>
        <Text style={TEXT.caption}>· {t('statsUpdated')}</Text>
      </View>
    </GlassCard>
  )
}
