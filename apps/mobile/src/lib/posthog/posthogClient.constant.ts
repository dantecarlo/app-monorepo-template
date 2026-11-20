// A PostHog project key is public by design: the app sends it with every
// event, so it lives under EXPO_PUBLIC_. With no key the app holds no client
// and sends nothing.
export const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY

// The ingestion host. us.posthog.com is the PostHog app and accepts no
// events; a project in the EU region sets https://eu.i.posthog.com.
export const POSTHOG_INGESTION_HOST_FALLBACK = 'https://us.i.posthog.com'

export const POSTHOG_HOST =
  process.env.EXPO_PUBLIC_POSTHOG_HOST || POSTHOG_INGESTION_HOST_FALLBACK

// The value babel-preset-expo inlines for process.env.EXPO_OS in a web
// bundle; unset reads as native.
export const WEB_PLATFORM = 'web'

// Unhandled rejections are exceptions, and so are uncaught exceptions on
// native. PostHog catches those through React Native's global error handler,
// whose deferred rethrow can break the chunk loading of an Expo web bundle,
// so a web bundle leaves them to the browser. Console errors stay off: they
// carry the text of whatever the app logged.
export const POSTHOG_ERROR_TRACKING = {
  autocapture: {
    console: false,
    uncaughtExceptions: process.env.EXPO_OS !== WEB_PLATFORM,
    unhandledRejections: true
  }
} as const

// The consent mode: `granted` captures from the start, the default; `opt-in`
// captures and stores nothing until consent is granted; `memory` captures but
// keeps nothing on the device. docs/observability.md describes each.
export const POSTHOG_CONSENT = process.env.EXPO_PUBLIC_POSTHOG_CONSENT

export const POSTHOG_CONSENT_ENV_NAME = 'EXPO_PUBLIC_POSTHOG_CONSENT'

export const PostHogConsentModeEnum = {
  GRANTED: 'granted',
  MEMORY: 'memory',
  OPT_IN: 'opt-in'
} as const

export type PostHogConsentModeType =
  (typeof PostHogConsentModeEnum)[keyof typeof PostHogConsentModeEnum]

// What each consent mode adds to the granted options. Opt-in also hands
// PostHog the consent storage, which writes nothing to the device before a
// grant; memory persistence keeps nothing there.
// How long a revoke waits for the client it stops to shut down. With its
// queues emptied it sends nothing; the wait covers a request still in flight.
export const POSTHOG_STOP_TIMEOUT_MS = 3000

export const POSTHOG_CONSENT_OPTIONS_BY_MODE = {
  [PostHogConsentModeEnum.GRANTED]: {},
  [PostHogConsentModeEnum.MEMORY]: { persistence: 'memory' },
  [PostHogConsentModeEnum.OPT_IN]: { defaultOptIn: false }
} as const
