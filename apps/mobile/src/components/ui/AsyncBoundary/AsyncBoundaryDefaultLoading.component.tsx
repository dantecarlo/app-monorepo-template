import { colors } from '@app/tokens'
import { ActivityIndicator, View } from 'react-native'

import { ASYNC_BOUNDARY_STYLES as styles } from '@/components/ui/AsyncBoundary/AsyncBoundary.styles'

export const AsyncBoundaryDefaultLoading = () => (
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
