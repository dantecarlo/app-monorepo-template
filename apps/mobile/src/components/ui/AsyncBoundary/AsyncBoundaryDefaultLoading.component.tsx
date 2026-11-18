import { colors } from '@app/tokens'
import { ActivityIndicator, View } from 'react-native'

import { ASYNC_BOUNDARY_STYLES as styles } from '@/components/ui/AsyncBoundary/AsyncBoundary.style'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'

export const AsyncBoundaryDefaultLoading = () => {
  const { t } = useAppTranslator()

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
