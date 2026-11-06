// ---------------------------------------------------------------------------
// justifying-comment.detect — decides whether a comment carries one of the
// justification phrasings, shared by the ESLint rule and its test suite.
//
// This set is narrow on purpose. The broad phrasings listed as the grep tell in
// code-standards §1.2 ("rather than", "instead of", "on purpose", …) were
// measured upstream across 2421 files and produced hundreds of false positives:
// legitimate behavior descriptions and constraint statements carry them. So
// §1.2 has two halves — the broad tell stays a review aid, and only the
// patterns below fail the build.
//
// The phrases are spelled ONLY in the list, never in the prose here: the rule
// reads comment tokens and would report this file.
// ---------------------------------------------------------------------------

// The date-carrying measurement narrative is matched case-sensitively with its
// date, so a prose mention of a measured value never fires.
export const JUSTIFYING_PHRASES = [
  { label: 'not because', pattern: /\bnot because\b/i },
  { label: 'exists because', pattern: /\bexists because\b/i },
  { label: 'exists to', pattern: /\bexists to\b/i },
  { label: 'trains everyone', pattern: /\btrains everyone\b/i },
  { label: 'says the opposite', pattern: /\bsays the opposite\b/i },
  { label: 'buys nothing', pattern: /\bbuys nothing\b/i },
  { label: 'a dated measurement', pattern: /\bMeasured 20\d\d-\d\d-\d\d/ }
]

export const findJustifyingPhrase = (text) =>
  JUSTIFYING_PHRASES.find(({ pattern }) => pattern.test(text)) ?? null
