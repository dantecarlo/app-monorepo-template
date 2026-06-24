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

export interface IObservabilityPort {
  captureError(params: ICaptureErrorParams): void
  captureMessage?(params: ICaptureMessageParams): void
}
