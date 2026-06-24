import React from 'react'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'

import { OFFLINE_BANNER_STYLES } from '@/components/ui/OfflineBanner/OfflineBanner.styles'

export interface IOfflineBannerProps {
  isOffline?: boolean
}

export const OfflineBanner = ({
  isOffline = false
}: IOfflineBannerProps) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'helper.offline'
  })

  if (!isOffline) {
    return null
  }

  return (
    <View
      accessibilityRole="alert"
      style={OFFLINE_BANNER_STYLES.container}
    >
      <Text style={OFFLINE_BANNER_STYLES.label}>{t('message')}</Text>
    </View>
  )
}
