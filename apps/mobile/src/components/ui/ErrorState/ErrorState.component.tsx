import { Pressable, View } from 'react-native'

import { ERROR_STATE_STYLES } from '@/components/ui/ErrorState/ErrorState.style'
import type { IErrorStateProps } from '@/components/ui/ErrorState/ErrorState.type'
import { Text } from '@/components/ui/Text/Text.component'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'
import { useThemedStyles } from '@/lib/theme/useThemedStyles.hook'

export const ErrorState = ({
  code,
  message,
  onRetry,
  resetErrorBoundary,
  title
}: IErrorStateProps) => {
  const styles = useThemedStyles({ styles: ERROR_STATE_STYLES })

  const { t } = useAppTranslator()

  const resolvedTitle =
    title ??
    (code !== undefined
      ? t(`components.errorState.byCode.${code}.title`)
      : t('components.errorState.title'))

  const resolvedMessage =
    message ??
    (code !== undefined
      ? t(`components.errorState.byCode.${code}.message`)
      : t('components.errorState.message'))

  const handleRetry = onRetry ?? resetErrorBoundary

  return (
    <View accessibilityRole="alert" style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.iconGlyph}>⚠</Text>
      </View>
      <Text style={styles.title}>{resolvedTitle}</Text>
      <Text style={styles.message}>{resolvedMessage}</Text>
      {handleRetry !== undefined && (
        <Pressable
          accessibilityRole="button"
          onPress={handleRetry}
          style={styles.retryButton}
        >
          <Text style={styles.retryLabel}>
            {t('components.errorState.retry')}
          </Text>
        </Pressable>
      )}
    </View>
  )
}
