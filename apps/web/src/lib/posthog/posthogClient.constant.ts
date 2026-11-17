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
