// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import type { IObservabilityPort } from './IObservabilityPort.type'

export const createNoopObservability = (): IObservabilityPort => ({
  captureError: () => undefined,
  captureMessage: () => undefined
})
