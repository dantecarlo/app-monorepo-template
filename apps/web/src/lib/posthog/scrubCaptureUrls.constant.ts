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
