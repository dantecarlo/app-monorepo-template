/**
 * Edge-safe constant-time string comparison.
 *
 * The cloudflare package runs in the Next.js EDGE runtime (via the `apps/web`
 * middleware), where `node:crypto` and `Buffer` are unavailable — importing
 * them crashes the request. The comparison is therefore implemented with
 * primitives the edge runtime supports: an equal-length guard (a length
 * mismatch is, by definition, not a match) followed by an XOR accumulation
 * over every char code, so the loop always runs the full length and never
 * short-circuits on the first differing character.
 */
export const isConstantTimeEqual = ({
  expected,
  presented
}: {
  expected: string
  presented: string
}): boolean => {
  if (presented.length !== expected.length) return false
  let mismatch = 0
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= presented.charCodeAt(index) ^ expected.charCodeAt(index)
  }
  return mismatch === 0
}
