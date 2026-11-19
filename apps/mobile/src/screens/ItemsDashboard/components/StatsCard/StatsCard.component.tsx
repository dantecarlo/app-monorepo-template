import { View } from 'react-native'

import { GlassCard } from '@/components/ui/GlassCard'
import { Text } from '@/components/ui/Text'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'
import { useThemedStyles } from '@/lib/theme/useThemedStyles.hook'
import { STATS_CARD_STYLES } from '@/screens/ItemsDashboard/components/StatsCard/StatsCard.style'
import type { IStatsCardProps } from '@/screens/ItemsDashboard/components/StatsCard/StatsCard.type'

export const StatsCard = ({
  activeCount,
  isError = false,
  isLoading,
  totalCount
}: IStatsCardProps) => {
  const styles = useThemedStyles({ styles: STATS_CARD_STYLES })

  const { t } = useAppTranslator()

  return (
    <GlassCard padding="lg" radius="xl">
      <View style={styles.headerRow}>
        <Text variant="label">{t('items.dashboard.statsOverview')}</Text>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.livePillText} variant="caption">
            {t('items.dashboard.statsLive')}
          </Text>
        </View>
      </View>

      {!isError && (
        <>
          <Text variant="amountHero">{isLoading ? '—' : totalCount}</Text>
          <Text style={styles.statsLabel} variant="label">
            {t('items.dashboard.statsTotalItems')}
          </Text>

          <View style={styles.subRow}>
            <View style={styles.activePill}>
              <Text style={styles.activePillText} variant="caption">
                {isLoading ? '—' : activeCount}{' '}
                {t('items.dashboard.statsActive')}
              </Text>
            </View>
            <Text variant="caption">
              · {t('items.dashboard.statsUpdated')}
            </Text>
          </View>
        </>
      )}
    </GlassCard>
  )
}
