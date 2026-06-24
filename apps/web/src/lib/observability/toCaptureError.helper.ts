import type { IObservabilityPort } from '@app/core'

export interface IToCaptureErrorParams {
  observability: IObservabilityPort
}

export const toCaptureError =
  ({ observability }: IToCaptureErrorParams) =>
  (error: unknown, ctx: { queryKey?: string[]; source: string }): void => {
    observability.captureError({ context: ctx, error })
  }
