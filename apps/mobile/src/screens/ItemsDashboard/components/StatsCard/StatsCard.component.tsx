import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { GlassCard } from '@/components/ui/GlassCard'
import { Text } from '@/components/ui/Text'
import { useThemedStyles } from '@/lib/theme/useThemedStyles.hook'
import { STATS_CARD_STYLES } from '@/screens/ItemsDashboard/components/StatsCard/StatsCard.style'
import type { IStatsCardProps } from '@/screens/ItemsDashboard/components/StatsCard/StatsCard.type'

export const StatsCard = ({
  activeCount,
  isLoading,
  totalCount
}: IStatsCardProps) => {
  const styles = useThemedStyles({ styles: STATS_CARD_STYLES })

  const { t } = useTranslation('translation', {
    keyPrefix: 'items.dashboard'
  })

  return (
    <GlassCard padding="lg" radius="xl">
      <View style={styles.headerRow}>
        <Text variant="label">{t('statsOverview')}</Text>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.livePillText} variant="caption">
            {t('statsLive')}
          </Text>
        </View>
      </View>

      <Text variant="amountHero">{isLoading ? '—' : totalCount}</Text>
      <Text style={styles.statsLabel} variant="label">
        {t('statsTotalItems')}
      </Text>

      <View style={styles.subRow}>
        <View style={styles.activePill}>
          <Text style={styles.activePillText} variant="caption">
            {isLoading ? '—' : activeCount} {t('statsActive')}
          </Text>
        </View>
        <Text variant="caption">· {t('statsUpdated')}</Text>
      </View>
    </GlassCard>
  )
}
