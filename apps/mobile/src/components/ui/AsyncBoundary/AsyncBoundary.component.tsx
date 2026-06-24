import { colors } from '@app/tokens'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'

import { ASYNC_BOUNDARY_STYLES as styles } from '@/components/ui/AsyncBoundary/AsyncBoundary.styles'

const RETRY_LABEL = 'Retry'

export interface IAsyncBoundaryProps {
  ErrorFallback?: React.ComponentType<{
    error: Error
    resetErrorBoundary: () => void
  }>
  children: React.ReactNode
  loadingFallback?: React.ReactNode
}

const DefaultLoadingFallback = () => (
  <View
    accessibilityLabel="Loading…"
    accessible
    style={[
      styles.fill,
      { alignItems: 'center', justifyContent: 'center' }
    ]}
  >
    <ActivityIndicator color={colors.accent} size="large" />
  </View>
)

const DefaultErrorFallback = ({
  error,
  resetErrorBoundary
}: {
  error: Error
  resetErrorBoundary: () => void
}) => (
  <View accessibilityRole="alert" style={styles.fill}>
    <Text>{error.message}</Text>
    <Pressable
      accessibilityLabel={RETRY_LABEL}
      accessibilityRole="button"
      onPress={resetErrorBoundary}
    >
      <Text>{RETRY_LABEL}</Text>
    </Pressable>
  </View>
)

export const AsyncBoundary = ({
  ErrorFallback = DefaultErrorFallback,
  children,
  loadingFallback = <DefaultLoadingFallback />
}: IAsyncBoundaryProps) => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <Suspense fallback={loadingFallback}>{children}</Suspense>
  </ErrorBoundary>
)
