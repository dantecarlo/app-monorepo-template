// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import type { ObservabilityLevelType } from './observabilityLevel.type'

export interface ICaptureErrorParams {
  context?: Record<string, unknown>
  error: unknown
}

export interface ICaptureMessageParams {
  context?: Record<string, unknown>
  level?: ObservabilityLevelType
  message: string
}

export interface IObservabilityUser {
  email?: string
  id: string
}

export interface ISetUserParams {
  user: IObservabilityUser | null
}

export interface IAddBreadcrumbParams {
  category?: string
  data?: Record<string, unknown>
  level?: ObservabilityLevelType
  message: string
}

export interface IObservabilityPort {
  addBreadcrumb?(params: IAddBreadcrumbParams): void
  captureError(params: ICaptureErrorParams): void
  captureMessage?(params: ICaptureMessageParams): void
  setUser?(params: ISetUserParams): void
}
