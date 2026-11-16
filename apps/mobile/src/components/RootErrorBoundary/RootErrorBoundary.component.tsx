import type { ErrorBoundaryProps } from 'expo-router'

import { ROOT_ERROR_BOUNDARY_STYLES as styles } from '@/components/RootErrorBoundary/RootErrorBoundary.style'
import { ErrorState } from '@/components/ui/ErrorState'
import { Screen } from '@/components/ui/Screen'
import { useReportBoundaryError } from '@/lib/observability/useReportBoundaryError.hook'

// Expo Router renders this for a crash in any route, and the crash is
// reported to observability once.
export const RootErrorBoundary = ({
  error,
  retry
}: ErrorBoundaryProps) => {
  useReportBoundaryError({ error })

  return (
    <Screen style={styles.screen}>
      <ErrorState onRetry={retry} />
    </Screen>
  )
}
