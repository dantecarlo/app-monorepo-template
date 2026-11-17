import {
  ObservabilityLevelEnum,
  type ObservabilityLevelType
} from '@app/core'

import type { PostHogLogLevelType } from '@/lib/posthog/posthogClient.type'

// The severity of each port level in a PostHog log record; PostHog names
// `warning` `warn`.
export const POSTHOG_LOG_LEVEL_BY_LEVEL: Record<
  ObservabilityLevelType,
  PostHogLogLevelType
> = {
  [ObservabilityLevelEnum.DEBUG]: 'debug',
  [ObservabilityLevelEnum.ERROR]: 'error',
  [ObservabilityLevelEnum.FATAL]: 'fatal',
  [ObservabilityLevelEnum.INFO]: 'info',
  [ObservabilityLevelEnum.WARNING]: 'warn'
}
