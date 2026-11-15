'use client'

import { ErrorState } from '@/components/ui/ErrorState'
import { LAYOUT } from '@/helpers/style.constant'

interface IRouteErrorProps {
  error: Error & { digest?: string }
  reset: () => void
  unstable_retry: () => void
}

// Root segment boundary: a render crash below the root layout lands here.
const RouteError = ({ unstable_retry: retry }: IRouteErrorProps) => (
  <main className={`${LAYOUT.MAX_WIDTH} ${LAYOUT.SCREEN_PADDING}`}>
    <ErrorState onRetry={retry} />
  </main>
)

export default RouteError
