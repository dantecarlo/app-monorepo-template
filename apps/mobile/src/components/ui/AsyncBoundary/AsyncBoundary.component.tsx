import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import type { IAsyncBoundaryProps } from '@/components/ui/AsyncBoundary/AsyncBoundary.type'
import { AsyncBoundaryDefaultError } from '@/components/ui/AsyncBoundary/AsyncBoundaryDefaultError.component'
import { AsyncBoundaryDefaultLoading } from '@/components/ui/AsyncBoundary/AsyncBoundaryDefaultLoading.component'

export const AsyncBoundary = ({
  ErrorFallback = AsyncBoundaryDefaultError,
  children,
  loadingFallback = <AsyncBoundaryDefaultLoading />
}: IAsyncBoundaryProps) => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <Suspense fallback={loadingFallback}>{children}</Suspense>
  </ErrorBoundary>
)
