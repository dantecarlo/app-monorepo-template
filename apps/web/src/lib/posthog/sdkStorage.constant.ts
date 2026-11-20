// posthog-js names every value it keeps in the browser for a project after
// the project key: its persistence `ph_<key>_posthog`, in a cookie and in
// local and session storage, the parts it keeps beside it (`ph_<key>_…`),
// and its stored consent `__ph_opt_in_out_<key>`.
export const SDK_STORAGE_PREFIX = 'ph_'

export const SDK_STORAGE_KEY_SUFFIX = '_'

export const SDK_CONSENT_PREFIX = '__ph_opt_in_out_'

// The characters posthog-js replaces in the key when it names its
// persistence; the parts beside it keep the key as it is.
export const SDK_PERSISTENCE_KEY_REPLACEMENTS: readonly (readonly [
  RegExp,
  string
])[] = [
  [/\+/gu, 'PL'],
  [/\//gu, 'SL'],
  [/=/gu, 'EQ']
]

export const COOKIE_SEPARATOR = ';'

export const COOKIE_VALUE_SEPARATOR = '='

export const HOST_LABEL_SEPARATOR = '.'

// A cookie that expired in the past is removed. posthog-js sets its cookie
// on the path `/`, on the host or on a parent domain of it.
export const EXPIRED_COOKIE_ATTRIBUTES =
  'expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
