// A PostHog project key is public by design: the browser sends it with every
// event, so it lives under NEXT_PUBLIC_. With no key the app holds no client
// and sends nothing.
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY

// The ingestion host. us.posthog.com is the PostHog app and accepts no
// events; a project in the EU region sets https://eu.i.posthog.com.
export const POSTHOG_INGESTION_HOST_FALLBACK = 'https://us.i.posthog.com'

export const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || POSTHOG_INGESTION_HOST_FALLBACK

// Unhandled errors and rejections are exceptions. Console errors stay off:
// they carry the text of whatever the app logged.
export const POSTHOG_EXCEPTION_AUTOCAPTURE = {
  capture_console_errors: false,
  capture_unhandled_errors: true,
  capture_unhandled_rejections: true
} as const

// The consent mode: `granted` captures from the start, the default; `opt-in`
// captures and stores nothing until consent is granted; `memory` captures but
// keeps nothing on the device. docs/observability.md describes each.
export const POSTHOG_CONSENT = process.env.NEXT_PUBLIC_POSTHOG_CONSENT

export const POSTHOG_CONSENT_ENV_NAME = 'NEXT_PUBLIC_POSTHOG_CONSENT'

export const PostHogConsentModeEnum = {
  GRANTED: 'granted',
  MEMORY: 'memory',
  OPT_IN: 'opt-in'
} as const

export type PostHogConsentModeType =
  (typeof PostHogConsentModeEnum)[keyof typeof PostHogConsentModeEnum]

// What each consent mode adds to the granted options. With both opt-out
// options the SDK neither captures nor persists while consent is pending or
// refused; memory persistence keeps no cookie, local or session storage.
export const POSTHOG_CONSENT_OPTIONS_BY_MODE = {
  [PostHogConsentModeEnum.GRANTED]: {},
  [PostHogConsentModeEnum.MEMORY]: { persistence: 'memory' },
  [PostHogConsentModeEnum.OPT_IN]: {
    opt_out_capturing_by_default: true,
    opt_out_persistence_by_default: true
  }
} as const
