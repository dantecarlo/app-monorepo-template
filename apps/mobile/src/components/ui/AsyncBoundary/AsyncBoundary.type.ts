import type { ComponentType, ReactNode } from 'react'

/** What the boundary hands its error fallback: the thrown value and a reset. */
export interface IAsyncBoundaryFallbackProps {
  error: unknown
  /** Clears the error and renders the children again. */
  resetErrorBoundary: () => void
}

export interface IAsyncBoundaryProps {
  children: ReactNode
  ErrorFallback?: ComponentType<IAsyncBoundaryFallbackProps>
  loadingFallback?: ReactNode
}
