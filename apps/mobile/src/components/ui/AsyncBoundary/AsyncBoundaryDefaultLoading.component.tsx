import { colors } from '@app/tokens'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, View } from 'react-native'

import { ASYNC_BOUNDARY_STYLES as styles } from '@/components/ui/AsyncBoundary/AsyncBoundary.style'

export const AsyncBoundaryDefaultLoading = () => {
  const { t } = useTranslation()

  return (
    <View
      accessibilityLabel={t('common.loading')}
      accessible
      style={[
        styles.fill,
        { alignItems: 'center', justifyContent: 'center' }
      ]}
    >
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  )
}
