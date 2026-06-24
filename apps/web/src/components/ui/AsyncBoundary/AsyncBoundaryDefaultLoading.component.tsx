'use client'

import type { JSX } from 'react'

import { asyncBoundaryVariants } from '@/components/ui/AsyncBoundary/AsyncBoundary.styles'

export const AsyncBoundaryDefaultLoading = (): JSX.Element => {
  const { loadingWrapper, spinner } = asyncBoundaryVariants()
  return (
    <div aria-busy="true" className={loadingWrapper()} role="status">
      <span aria-hidden="true" className={spinner()} />
      <span className="sr-only">Loading…</span>
    </div>
  )
}
