import type { ErrorBoundaryProps } from 'expo-router'
import { View } from 'react-native'

import { ROOT_ERROR_BOUNDARY_STYLES as styles } from '@/components/RootErrorBoundary/RootErrorBoundary.style'
import { ErrorState } from '@/components/ui/ErrorState'
import { useRootTheme } from '@/lib/theme/useRootTheme.hook'

export const RootErrorBoundary = ({ retry }: ErrorBoundaryProps) => {
  const { contentBackgroundColor } = useRootTheme()

  return (
    <View
      style={[styles.screen, { backgroundColor: contentBackgroundColor }]}
    >
      <ErrorState onRetry={retry} />
    </View>
  )
}
