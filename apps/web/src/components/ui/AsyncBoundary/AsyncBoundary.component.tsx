'use client'

import type { ComponentType, JSX, ReactNode } from 'react'
import { Suspense } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'

import { asyncBoundaryVariants } from '@/components/ui/AsyncBoundary/AsyncBoundary.styles'

export interface IAsyncBoundaryProps {
  ErrorFallback?: ComponentType<FallbackProps>
  children: ReactNode
  loadingFallback?: ReactNode
}

const DefaultLoadingFallback = (): JSX.Element => {
  const { loadingWrapper, spinner } = asyncBoundaryVariants()
  return (
    <div aria-busy="true" className={loadingWrapper()} role="status">
      <span aria-hidden="true" className={spinner()} />
      <span className="sr-only">Loading…</span>
    </div>
  )
}

const DefaultErrorFallback = ({
  error,
  resetErrorBoundary
}: FallbackProps): JSX.Element => (
  <div aria-live="assertive" role="alert">
    <p>{error instanceof Error ? error.message : 'An error occurred'}</p>
    <button onClick={resetErrorBoundary} type="button">
      Retry
    </button>
  </div>
)

export const AsyncBoundary = ({
  ErrorFallback = DefaultErrorFallback,
  children,
  loadingFallback = <DefaultLoadingFallback />
}: IAsyncBoundaryProps): JSX.Element => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <Suspense fallback={loadingFallback}>{children}</Suspense>
  </ErrorBoundary>
)
