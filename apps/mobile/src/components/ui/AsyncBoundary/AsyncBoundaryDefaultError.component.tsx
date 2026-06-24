import type { FallbackProps } from 'react-error-boundary'
import { Pressable, Text, View } from 'react-native'

import { ASYNC_BOUNDARY_STYLES as styles } from '@/components/ui/AsyncBoundary/AsyncBoundary.styles'

const RETRY_LABEL = 'Retry'

export const AsyncBoundaryDefaultError = ({
  error,
  resetErrorBoundary
}: FallbackProps) => (
  <View accessibilityRole="alert" style={styles.fill}>
    <Text>
      {error instanceof Error ? error.message : 'An error occurred'}
    </Text>
    <Pressable
      accessibilityLabel={RETRY_LABEL}
      accessibilityRole="button"
      onPress={resetErrorBoundary}
    >
      <Text>{RETRY_LABEL}</Text>
    </Pressable>
  </View>
)
