/**
 * The cache-life profiles Next ships. Each sets how long a cached result
 * stays fresh on the client, when the server revalidates it and when it
 * expires; a profile configured in next.config.ts adds its member here.
 */
export const CacheLifeEnum = {
  DAYS: 'days',
  DEFAULT: 'default',
  HOURS: 'hours',
  MAX: 'max',
  MINUTES: 'minutes',
  SECONDS: 'seconds',
  WEEKS: 'weeks'
} as const
