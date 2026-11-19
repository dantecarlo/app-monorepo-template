import React from 'react'
import { View } from 'react-native'

import { OFFLINE_BANNER_STYLES } from '@/components/ui/OfflineBanner/OfflineBanner.style'
import type { IOfflineBannerProps } from '@/components/ui/OfflineBanner/OfflineBanner.type'
import { Text } from '@/components/ui/Text/Text.component'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'
import { useThemedStyles } from '@/lib/theme/useThemedStyles.hook'

export const OfflineBanner = ({
  isOffline = false
}: IOfflineBannerProps) => {
  const styles = useThemedStyles({ styles: OFFLINE_BANNER_STYLES })

  const { t } = useAppTranslator()

  if (!isOffline) {
    return null
  }

  return (
    <View accessibilityRole="alert" style={styles.container}>
      <Text style={styles.label}>{t('helper.offline.message')}</Text>
    </View>
  )
}
