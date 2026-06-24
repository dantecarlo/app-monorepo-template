import {
  createNoopObservability,
  type IObservabilityPort
} from '@app/core'

export const observability: IObservabilityPort = createNoopObservability()
