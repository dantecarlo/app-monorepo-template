import type { IObservabilityPort } from '@app/core'

export interface IReportBoundaryErrorParams {
  /** The digest Next.js gives an error thrown on the server. */
  digest?: string
  error: unknown
  observability: IObservabilityPort
}

export interface IUseReportBoundaryErrorParams {
  error: Error & { digest?: string }
}
