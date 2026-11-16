import type { IObservabilityPort } from '@app/core'

export interface IReportBoundaryErrorParams {
  error: unknown
  observability: IObservabilityPort
}

export interface IUseReportBoundaryErrorParams {
  error: Error
}
