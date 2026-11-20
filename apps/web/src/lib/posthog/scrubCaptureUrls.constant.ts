// The properties posthog-js fills with a page URL, path or referrer:
// `$current_url`, `$pathname`, `$referrer`, `$session_entry_url`,
// `$initial_referrer` and every other `$…url`, `$…referrer` or `$…pathname`.
export const CAPTURE_URL_PROPERTY_PATTERN =
  /^\$.*(?:url|referrer|pathname)$/u

// The heatmap property, whose keys are page URLs.
export const HEATMAP_DATA_PROPERTY = '$heatmap_data'

// The query string and the fragment: from the first `?` or `#` on. Either can
// carry a token or an email (an invite link, a password reset, an OAuth
// redirect).
export const URL_SUFFIX_PATTERN = /[?#][\s\S]*$/u

// The scheme and the host of an absolute URL, which the path scrub keeps.
export const URL_ORIGIN_PATTERN = /^[a-z][a-z\d+.-]*:\/\/[^/]*/iu

export const PATH_SEGMENT_SEPARATOR = '/'

// A path segment that holds an email, plain or percent-encoded.
export const EMAIL_SEGMENT_PATTERN = /@|%40/iu

// A segment this long that holds a digit, read decoded, reads as a token (a
// JWT, a UUID, a hex or base64 token, a card number): route names hold no
// digit, and ids are shorter.
export const SECRET_SEGMENT_MIN_LENGTH = 16

export const DIGIT_PATTERN = /\d/u

// A word slug, which the scrub keeps however long it is: lowercase words and
// numbers of at most four digits joined by hyphens, with at least one word.
export const WORD_SLUG_PATTERN =
  /^(?=[^a-z]*[a-z])(?:[a-z]+|\d{1,4})(?:-(?:[a-z]+|\d{1,4}))+$/u

// A slug of short parts, which it keeps too: two or more parts of letters
// and digits joined by hyphens or underscores, each of at most 11
// characters, one at least holding a letter. A UUID's last part has 12
// characters, and the parts of a card number hold no letter.
export const SHORT_PART_SLUG_PATTERN =
  /^(?=.*\p{L})[\p{L}\d]{1,11}(?:[-_][\p{L}\d]{1,11})+$/u

// What a segment that reads as a secret becomes, so the route keeps its shape.
export const REDACTED_SEGMENT = ':redacted'
