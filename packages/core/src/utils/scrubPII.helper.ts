/**
 * Redacts known sensitive fields from any value before it reaches a
 * monitoring sink (e.g. Sentry beforeSend / beforeBreadcrumb).
 *
 * Contract:
 * - Generic: `scrubPII<T>(input: T): T` — the return type matches the input.
 * - PII_KEYS lists every field name that must be redacted. Matching is done on
 *   a NORMALIZED key (lowercased, non-alphanumerics stripped) and compared for
 *   exact equality against the normalized set. This catches transport-header
 *   variants such as "Authorization", "set-cookie", "access-token", and
 *   "x-api-key" without resorting to substring matching — so unrelated keys
 *   like "tokenCount" or "apikeyLabel" are NOT over-redacted.
 * - The key "name" is intentionally NOT in the set. In many product domains
 *   "name" refers to a business or entity name, not a personal name. If your
 *   project treats "name" as PII, add it to PII_KEYS locally.
 * - Circular references are replaced with '[circular]' instead of throwing.
 * - Arrays are recursed element-by-element; primitives are returned as-is.
 */

const REDACTED = '[redacted]'

export const PII_KEYS: ReadonlySet<string> = new Set([
  'access_token',
  'accesstoken',
  'apikey',
  'authorization',
  'cookie',
  'email',
  'full_name',
  'fullname',
  'jwt',
  'password',
  'payer_name',
  'payername',
  'phone',
  'phonenumber',
  'raw_text',
  'rawtext',
  'refresh_token',
  'secret',
  'session',
  'set-cookie',
  'token',
  'xapikey'
])

const NON_ALPHANUMERIC = /[^a-z0-9]/g

const normalizeKey = (key: string): string =>
  key.toLowerCase().replace(NON_ALPHANUMERIC, '')

const NORMALIZED_PII_KEYS: ReadonlySet<string> = new Set(
  [...PII_KEYS].map(normalizeKey)
)

const isSensitiveKey = (key: string): boolean =>
  NORMALIZED_PII_KEYS.has(normalizeKey(key))

export const scrubPII = <T>(input: T, _seen = new WeakSet()): T => {
  if (input === null || input === undefined) return input

  if (Array.isArray(input)) {
    return input.map((item) => scrubPII(item, _seen)) as unknown as T
  }

  if (typeof input === 'object') {
    if (_seen.has(input as object)) return '[circular]' as unknown as T
    _seen.add(input as object)

    return Object.fromEntries(
      Object.entries(input as Record<string, unknown>).map(
        ([key, value]) => [
          key,
          isSensitiveKey(key) ? REDACTED : scrubPII(value, _seen)
        ]
      )
    ) as unknown as T
  }

  return input
}
