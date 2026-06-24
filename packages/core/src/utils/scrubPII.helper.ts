/**
 * Redacts known sensitive fields from any value before it reaches a
 * monitoring sink (e.g. Sentry beforeSend / beforeBreadcrumb).
 *
 * Contract:
 * - Generic: `scrubPII<T>(input: T): T` — the return type matches the input.
 * - PII_KEYS lists every field name that must be redacted. Key matching is
 *   case-insensitive (e.g. "Email", "EMAIL" are both caught).
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
  'email',
  'full_name',
  'fullname',
  'password',
  'payer_name',
  'payername',
  'phone',
  'phonenumber',
  'raw_text',
  'rawtext',
  'refresh_token',
  'secret',
  'token'
])

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
          PII_KEYS.has(key.toLowerCase())
            ? REDACTED
            : scrubPII(value, _seen)
        ]
      )
    ) as unknown as T
  }

  return input
}
