import { colors } from '@app/tokens'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'

import { IconButton } from '@/components/ui/IconButton'
import { TEXT } from '@/helpers/style.constant'
import { DASHBOARD_HEADER_STYLES as styles } from '@/screens/ItemsDashboard/components/DashboardHeader/DashboardHeader.styles'
import { GRADIENT_BRAND_COLORS } from '@/screens/ItemsDashboard/components/ItemCard'

export const DashboardHeader = () => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'items.dashboard'
  })
  const { t: tRoot } = useTranslation()
  const appName = tRoot('app.name')

  return (
    <View style={styles.root}>
      <View style={styles.wordmark}>
        <LinearGradient
          accessibilityLabel={appName}
          colors={GRADIENT_BRAND_COLORS}
          style={styles.badge}
        >
          <Text style={[{ color: colors.accentInk }, styles.badgeText]}>
            {appName.charAt(0)}
          </Text>
        </LinearGradient>
        <View>
          <Text style={TEXT.caption}>{t('welcomeBack')}</Text>
          <Text style={TEXT.title}>{t('title')}</Text>
        </View>
      </View>

      <IconButton
        accessibilityLabel={t('settingsLabel')}
        name="settings"
        onPress={() => undefined}
      />
    </View>
  )
}
