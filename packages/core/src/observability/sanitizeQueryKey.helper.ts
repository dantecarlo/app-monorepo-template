/**
 * sanitizeQueryKey — reduce a TanStack Query key to a PII-safe shape before
 * it is attached to an error report.
 *
 * Query keys mix static structure (e.g. `'items'`, `'list'`) with dynamic
 * identifiers (ids, tokens) and sometimes filter objects. The dynamic parts
 * can be user-identifying, so we keep only the structural string segments and
 * redact everything else:
 *
 *   ['items', '8f3c…uuid', 'list']   → ['items', '[redacted]', 'list']
 *   ['users', { role: 'admin' }]     → ['users', '[redacted]']
 *
 * A string segment is treated as structural (kept) only when it is a short
 * lowercase token (a hand-written key segment). Anything that looks like an
 * id — uuid, long token, contains digits or separators — is redacted.
 */

export const REDACTED_SEGMENT = '[redacted]'

const MAX_STRUCTURAL_LENGTH = 24
const STRUCTURAL_SEGMENT_PATTERN = /^[a-z][a-zA-Z]*$/

const isStructuralSegment = (segment: string): boolean =>
  segment.length > 0 &&
  segment.length <= MAX_STRUCTURAL_LENGTH &&
  STRUCTURAL_SEGMENT_PATTERN.test(segment)

const sanitizeSegment = (segment: unknown): string => {
  if (typeof segment === 'string' && isStructuralSegment(segment)) {
    return segment
  }
  return REDACTED_SEGMENT
}

export interface ISanitizeQueryKeyParams {
  queryKey: unknown
}

export const sanitizeQueryKey = ({
  queryKey
}: ISanitizeQueryKeyParams): string[] => {
  if (!Array.isArray(queryKey)) return [REDACTED_SEGMENT]
  return queryKey.map(sanitizeSegment)
}
