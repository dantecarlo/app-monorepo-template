import type { ComponentType, ReactNode } from 'react'
import type { FallbackProps } from 'react-error-boundary'

export interface IAsyncBoundaryProps {
  children: ReactNode
  ErrorFallback?: ComponentType<FallbackProps>
  loadingFallback?: ReactNode
}
