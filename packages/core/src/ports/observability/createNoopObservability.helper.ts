import type { IObservabilityPort } from '@/ports/observability/IObservabilityPort.type'

export const createNoopObservability = (): IObservabilityPort => ({
  captureError: () => undefined,
  captureMessage: () => undefined
})
