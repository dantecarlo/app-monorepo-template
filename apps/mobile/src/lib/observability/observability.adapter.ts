import type { IObservabilityPort } from '@app/core'

import { createPostHogObservability } from '@/lib/observability/createPostHogObservability.adapter'

// The composition root: the one line that picks the provider. PostHog is the
// default; docs/observability.md lists the adapters that swap in here.
export const observability: IObservabilityPort =
  createPostHogObservability()
