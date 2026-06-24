'use client'

import type { ComponentType, JSX, ReactNode } from 'react'
import { Suspense } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'

import { AsyncBoundaryDefaultError } from '@/components/ui/AsyncBoundary/AsyncBoundaryDefaultError.component'
import { AsyncBoundaryDefaultLoading } from '@/components/ui/AsyncBoundary/AsyncBoundaryDefaultLoading.component'

export interface IAsyncBoundaryProps {
  children: ReactNode
  ErrorFallback?: ComponentType<FallbackProps>
  loadingFallback?: ReactNode
}

export const AsyncBoundary = ({
  ErrorFallback = AsyncBoundaryDefaultError,
  children,
  loadingFallback = <AsyncBoundaryDefaultLoading />
}: IAsyncBoundaryProps): JSX.Element => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <Suspense fallback={loadingFallback}>{children}</Suspense>
  </ErrorBoundary>
)
