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
 * - A cycle is replaced with '[circular]' instead of throwing: an object or
 *   array becomes '[circular]' where the walk meets it again inside itself.
 *   One reached twice without a cycle is scrubbed in both places.
 * - Arrays are recursed element-by-element; primitives are returned as-is.
 */

const REDACTED = '[redacted]'
const CIRCULAR = '[circular]'

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

interface IScrubValueParams {
  ancestors: WeakSet<object>
  value: unknown
}

// `ancestors` holds the objects and arrays above `value` on the current path,
// so only a cycle meets one of them again. Each leaves the set once walked.
const scrubValue = ({ ancestors, value }: IScrubValueParams): unknown => {
  if (value === null || typeof value !== 'object') return value
  if (ancestors.has(value)) return CIRCULAR

  ancestors.add(value)
  const scrubbed = Array.isArray(value)
    ? value.map((item) => scrubValue({ ancestors, value: item }))
    : Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [
          key,
          isSensitiveKey(key)
            ? REDACTED
            : scrubValue({ ancestors, value: entry })
        ])
      )
  ancestors.delete(value)

  return scrubbed
}

export const scrubPII = <T>(input: T): T =>
  scrubValue({ ancestors: new WeakSet(), value: input }) as T
