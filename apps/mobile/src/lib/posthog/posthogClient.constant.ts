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
