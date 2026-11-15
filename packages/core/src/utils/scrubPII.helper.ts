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
 * - Each object or array is walked once. Every other place that reaches it
 *   gets the same scrubbed copy, so a graph that shares objects (a React DOM
 *   node in a console breadcrumb) costs one walk per object, not per path.
 * - The result therefore shares each scrubbed copy wherever the input shared
 *   the object. A serializer with no depth limit writes a shared copy once per
 *   path that reaches it, so a sink needs a depth limit of its own; Sentry
 *   normalizes breadcrumb data, user, contexts and extra to `normalizeDepth`
 *   (default 3, which neither app changes) before `beforeSend`.
 * - Arrays are recursed element-by-element; primitives are returned as-is.
 */

const REDACTED = '[redacted]'
const CIRCULAR = '[circular]'
const IN_PROGRESS: unique symbol = Symbol('scrubPII.inProgress')

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
  copies: WeakMap<object, unknown>
  value: unknown
}

// `copies` maps each object or array met so far to its scrubbed copy, or to
// IN_PROGRESS while it is still being walked: meeting it then is a cycle.
const scrubValue = ({ copies, value }: IScrubValueParams): unknown => {
  if (value === null || typeof value !== 'object') return value
  if (copies.has(value)) {
    const copy = copies.get(value)
    return copy === IN_PROGRESS ? CIRCULAR : copy
  }

  copies.set(value, IN_PROGRESS)
  const scrubbed = Array.isArray(value)
    ? value.map((item) => scrubValue({ copies, value: item }))
    : Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [
          key,
          isSensitiveKey(key)
            ? REDACTED
            : scrubValue({ copies, value: entry })
        ])
      )
  copies.set(value, scrubbed)

  return scrubbed
}

export const scrubPII = <T>(input: T): T =>
  scrubValue({ copies: new WeakMap(), value: input }) as T
