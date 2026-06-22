/**
 * Redacts known sensitive fields from any object before it is
 * sent to a monitoring service (e.g. Sentry).
 *
 * Add field names to SENSITIVE_KEYS as the project grows.
 */
const SENSITIVE_KEYS = new Set([
  'email',
  'name',
  'password',
  'phone',
  'token'
])

const REDACTED = '[Redacted]'

export const scrubPII = (data: unknown): unknown => {
  if (Array.isArray(data)) {
    return data.map(scrubPII)
  }

  if (data !== null && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(
        ([key, value]) => [
          key,
          SENSITIVE_KEYS.has(key.toLowerCase())
            ? REDACTED
            : scrubPII(value)
        ]
      )
    )
  }

  return data
}
