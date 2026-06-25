import type { IObservabilityPort } from '@app/core'

import { createSentryObservability } from '@/lib/observability/createSentryObservability.adapter'

export const observability: IObservabilityPort =
  createSentryObservability()
