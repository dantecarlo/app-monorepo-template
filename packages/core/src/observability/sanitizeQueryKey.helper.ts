/**
 * sanitizeQueryKey — reduce a TanStack Query key to a PII-safe shape before
 * it is attached to an error report.
 *
 * Query keys mix static structure (e.g. `'items'`, `'list'`) with dynamic
 * values (ids, search text, filter objects), which can identify a user. No
 * pattern tells a hand-written `'list'` from a typed `'alice'`, so the caller
 * names its structural segments and every other segment is redacted:
 *
 *   ['items', '8f3c…uuid', 'list']   → ['items', '[redacted]', 'list']
 *   ['items', 'list', 'alice']       → ['items', 'list', '[redacted]']
 *   ['users', { role: 'admin' }]     → ['users', '[redacted]']
 *
 * A segment the caller forgot to register is redacted too: a missing entry
 * costs detail in the report, never a leaked value.
 */

export const REDACTED_SEGMENT = '[redacted]'

export interface ISanitizeQueryKeyParams {
  queryKey: unknown
  structuralSegments: ReadonlySet<string>
}

export const sanitizeQueryKey = ({
  queryKey,
  structuralSegments
}: ISanitizeQueryKeyParams): string[] => {
  if (!Array.isArray(queryKey)) return [REDACTED_SEGMENT]
  return queryKey.map((segment: unknown) =>
    typeof segment === 'string' && structuralSegments.has(segment)
      ? segment
      : REDACTED_SEGMENT
  )
}
