import { ErrorStateCodeEnum } from '@/components/ui/ErrorState/ErrorState.constant'

export interface IErrorStateProps {
  code?: ErrorStateCodeEnum
  error?: unknown
  message?: string
  onRetry?: () => void
  resetErrorBoundary?: () => void
  title?: string
}
