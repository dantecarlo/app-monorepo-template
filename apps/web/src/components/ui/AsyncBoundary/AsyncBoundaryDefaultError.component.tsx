'use client'

import type { JSX } from 'react'
import type { FallbackProps } from 'react-error-boundary'

export const AsyncBoundaryDefaultError = ({
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
