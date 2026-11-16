import { colors } from '@app/tokens'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { AccentGradient } from '@/components/ui/AccentGradient'
import { Text } from '@/components/ui/Text'
import { DASHBOARD_HEADER_STYLES as styles } from '@/screens/ItemsDashboard/components/DashboardHeader/DashboardHeader.style'

export const DashboardHeader = () => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'items.dashboard'
  })
  const { t: tRoot } = useTranslation()
  const appName = tRoot('app.name')

  return (
    <View style={styles.root}>
      <View style={styles.wordmark}>
        <AccentGradient accessibilityLabel={appName} style={styles.badge}>
          <Text style={[{ color: colors.accentInk }, styles.badgeText]}>
            {appName.charAt(0)}
          </Text>
        </AccentGradient>
        <View>
          <Text variant="caption">{t('welcomeBack')}</Text>
          <Text variant="title">{t('title')}</Text>
        </View>
      </View>
    </View>
  )
}
