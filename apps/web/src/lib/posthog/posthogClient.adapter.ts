import { createDeferredClient } from '@/lib/posthog/deferredClient.helper'
import type { IDeferredClient } from '@/lib/posthog/deferredClient.type'
import { hasGrantRecord } from '@/lib/posthog/grantRecord.adapter'
import {
  POSTHOG_CONSENT,
  POSTHOG_CONSENT_OPTIONS_BY_MODE,
  POSTHOG_EXCEPTION_AUTOCAPTURE,
  POSTHOG_HOST,
  POSTHOG_KEY,
  POSTHOG_PENDING_CALLS_LIMIT,
  PostHogConsentModeEnum,
  type PostHogConsentModeType
} from '@/lib/posthog/posthogClient.constant'
import type { IPostHogClient } from '@/lib/posthog/posthogClient.type'
import { resolveConsentMode } from '@/lib/posthog/resolveConsentMode.helper'
import { scrubCaptureUrls } from '@/lib/posthog/scrubCaptureUrls.helper'
import { removeSdkStorage } from '@/lib/posthog/sdkStorage.adapter'

// posthog-js runs in the browser only. On the server, and in every run with
// no key, the SDK is never loaded and no request leaves the app.
const IS_BROWSER = typeof window !== 'undefined'

/**
 * The consent mode the client starts in. Read whenever a key is set, on the
 * server too, so an unknown value throws in the prerender of `next build` as
 * well as in the browser.
 */
export const posthogConsentMode: PostHogConsentModeType = POSTHOG_KEY
  ? resolveConsentMode({ value: POSTHOG_CONSENT })
  : PostHogConsentModeEnum.GRANTED

/** Whether this run may load PostHog: a key is set, in the browser. */
export const isPostHogAvailable = Boolean(POSTHOG_KEY) && IS_BROWSER

/**
 * The ONE PostHog client of this app. It holds no client until the SDK has
 * loaded, holds the calls made while it loads, and drops every call while
 * nothing is loading.
 */
export const posthogClient: IDeferredClient<IPostHogClient> =
  createDeferredClient({ limit: POSTHOG_PENDING_CALLS_LIMIT })

// The SDK module stays loaded after a revoke stops the client, so a later
// start finds it initialised.
const initialised: { client?: IPostHogClient } = {}

// The only place the SDK is imported: on demand, so its chunk is not among
// the ones a page loads at start.
const loadPostHog = async ({
  consentMode,
  key
}: {
  consentMode: PostHogConsentModeType
  key: string
}): Promise<IPostHogClient> => {
  const { default: posthog } = await import('posthog-js')
  if (!initialised.client) {
    posthog.init(key, {
      api_host: POSTHOG_HOST,
      // DOM autocapture is off, form inputs included, and so are dead clicks,
      // which describe the clicked element the same way.
      autocapture: false,
      before_send: scrubCaptureUrls,
      capture_dead_clicks: false,
      capture_exceptions: POSTHOG_EXCEPTION_AUTOCAPTURE,
      disable_session_recording: true,
      ...POSTHOG_CONSENT_OPTIONS_BY_MODE[consentMode]
    })
    initialised.client = posthog
  }
  return initialised.client
}

/**
 * Loads and initialises the SDK once, and resolves to the client; undefined
 * without a key, on the server, or when the SDK fails to load. The app starts
 * it at load in `granted` and `memory` mode; in `opt-in` mode a grant starts
 * it, or a grant recorded on an earlier visit at load.
 */
export const startPostHogClient = (): Promise<
  IPostHogClient | undefined
> => {
  if (!POSTHOG_KEY || !IS_BROWSER) return Promise.resolve(undefined)
  const key = POSTHOG_KEY
  return posthogClient.start({
    load: () => loadPostHog({ consentMode: posthogConsentMode, key })
  })
}

// A project that switched from `granted` to `opt-in` leaves what `granted`
// stored in this browser, which no SDK is loaded to read: an `opt-in` start
// with no recorded grant removes it instead of starting the client.
if (isPostHogAvailable && POSTHOG_KEY) {
  if (
    posthogConsentMode === PostHogConsentModeEnum.OPT_IN &&
    !hasGrantRecord()
  ) {
    removeSdkStorage({ key: POSTHOG_KEY })
  } else {
    void startPostHogClient()
  }
}
