import React from 'react'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'

import { OFFLINE_BANNER_STYLES } from '@/components/ui/OfflineBanner/OfflineBanner.style'
import type { IOfflineBannerProps } from '@/components/ui/OfflineBanner/OfflineBanner.type'
import { useThemedStyles } from '@/lib/theme/useThemedStyles.hook'

export const OfflineBanner = ({
  isOffline = false
}: IOfflineBannerProps) => {
  const styles = useThemedStyles({ styles: OFFLINE_BANNER_STYLES })

  const { t } = useTranslation('translation', {
    keyPrefix: 'helper.offline'
  })

  if (!isOffline) {
    return null
  }

  return (
    <View accessibilityRole="alert" style={styles.container}>
      <Text style={styles.label}>{t('message')}</Text>
    </View>
  )
}
