import type { ErrorBoundaryProps } from 'expo-router'

import { ROOT_ERROR_BOUNDARY_STYLES as styles } from '@/components/RootErrorBoundary/RootErrorBoundary.style'
import { ErrorState } from '@/components/ui/ErrorState'
import { Screen } from '@/components/ui/Screen'

export const RootErrorBoundary = ({ retry }: ErrorBoundaryProps) => (
  <Screen style={styles.screen} themed>
    <ErrorState onRetry={retry} />
  </Screen>
)
