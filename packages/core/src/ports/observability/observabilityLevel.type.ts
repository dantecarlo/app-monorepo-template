export const ObservabilityLevelEnum = {
  DEBUG: 'debug',
  ERROR: 'error',
  FATAL: 'fatal',
  INFO: 'info',
  WARNING: 'warning'
} as const

export type ObservabilityLevelType =
  (typeof ObservabilityLevelEnum)[keyof typeof ObservabilityLevelEnum]
