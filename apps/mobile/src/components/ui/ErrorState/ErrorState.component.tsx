import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'

import { ErrorStateCodeEnum } from '@/components/ui/ErrorState/ErrorState.constant'
import { ERROR_STATE_STYLES as styles } from '@/components/ui/ErrorState/ErrorState.styles'

export interface IErrorStateProps {
  code?: ErrorStateCodeEnum
  error?: unknown
  message?: string
  onRetry?: () => void
  resetErrorBoundary?: () => void
  title?: string
}

export const ErrorState = ({
  code,
  message,
  onRetry,
  resetErrorBoundary,
  title
}: IErrorStateProps) => {
  const { t } = useTranslation()

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
