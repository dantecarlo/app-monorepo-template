// The grant the consent API records in the browser's local storage under
// opt-in, the key the mobile consent storage uses on the device. The next
// visit reads it to load PostHog at start.
export const GRANT_RECORD_KEY = 'posthog-consent:granted'

export const GRANT_RECORD_VALUE = 'true'
