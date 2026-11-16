'use client'

import { ErrorState } from '@/components/ui/ErrorState'
import { LAYOUT } from '@/helpers/layout.style'
import { useReportBoundaryError } from '@/lib/observability/useReportBoundaryError.hook'

interface IRouteErrorProps {
  error: Error & { digest?: string }
  reset: () => void
  unstable_retry: () => void
}

// Root segment boundary: a render crash below the root layout lands here,
// and is reported to observability once. global-error.tsx renders it too.
const RouteError = ({
  error,
  unstable_retry: retry
}: IRouteErrorProps) => {
  useReportBoundaryError({ error })

  return (
    <main className={`${LAYOUT.MAX_WIDTH} ${LAYOUT.SCREEN_PADDING}`}>
      <ErrorState onRetry={retry} />
    </main>
  )
}

export default RouteError
