import type { IObservabilityPort } from './IObservabilityPort.type'

export const createNoopObservability = (): IObservabilityPort => ({
  addBreadcrumb: () => undefined,
  captureError: () => undefined,
  captureMessage: () => undefined,
  setUser: () => undefined
})
