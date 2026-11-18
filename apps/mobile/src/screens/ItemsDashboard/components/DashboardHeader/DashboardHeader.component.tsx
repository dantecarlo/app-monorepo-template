import { colors } from '@app/tokens'
import { View } from 'react-native'

import { AccentGradient } from '@/components/ui/AccentGradient'
import { Text } from '@/components/ui/Text'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'
import { DASHBOARD_HEADER_STYLES as styles } from '@/screens/ItemsDashboard/components/DashboardHeader/DashboardHeader.style'

export const DashboardHeader = () => {
  const { t } = useAppTranslator()
  const appName = t('app.name')

  return (
    <View style={styles.root}>
      <View style={styles.wordmark}>
        <AccentGradient accessibilityLabel={appName} style={styles.badge}>
          <Text style={[{ color: colors.accentInk }, styles.badgeText]}>
            {appName.charAt(0)}
          </Text>
        </AccentGradient>
        <View>
          <Text variant="caption">{t('items.dashboard.welcomeBack')}</Text>
          <Text variant="title">{t('items.dashboard.title')}</Text>
        </View>
      </View>
    </View>
  )
}
