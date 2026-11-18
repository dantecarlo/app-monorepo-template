import type { FallbackProps } from 'react-error-boundary'
import { Pressable, Text, View } from 'react-native'

import { ASYNC_BOUNDARY_STYLES as styles } from '@/components/ui/AsyncBoundary/AsyncBoundary.style'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'

export const AsyncBoundaryDefaultError = ({
  error,
  resetErrorBoundary
}: FallbackProps) => {
  const { t } = useAppTranslator()

  return (
    <View accessibilityRole="alert" style={styles.fill}>
      <Text>
        {error instanceof Error
          ? error.message
          : t('helper.error.generic')}
      </Text>
      <Pressable
        accessibilityLabel={t('common.retry')}
        accessibilityRole="button"
        onPress={resetErrorBoundary}
      >
        <Text>{t('common.retry')}</Text>
      </Pressable>
    </View>
  )
}
