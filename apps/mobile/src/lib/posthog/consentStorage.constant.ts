// Every key PostHog writes through the consent storage lands in AsyncStorage
// under this prefix, apart from what the rest of the app keeps there.
export const CONSENT_STORAGE_PREFIX = 'posthog-consent:'

// On the device only while consent is granted; the next launch reads it.
export const CONSENT_GRANTED_KEY = `${CONSENT_STORAGE_PREFIX}granted`

export const CONSENT_GRANTED_VALUE = 'true'
