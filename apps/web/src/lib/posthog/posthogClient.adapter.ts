import posthog from 'posthog-js'

import {
  POSTHOG_CONSENT,
  POSTHOG_CONSENT_OPTIONS_BY_MODE,
  POSTHOG_EXCEPTION_AUTOCAPTURE,
  POSTHOG_HOST,
  POSTHOG_KEY,
  PostHogConsentModeEnum,
  type PostHogConsentModeType
} from '@/lib/posthog/posthogClient.constant'
import type { IPostHogClient } from '@/lib/posthog/posthogClient.type'
import { resolveConsentMode } from '@/lib/posthog/resolveConsentMode.helper'
import { scrubCaptureUrls } from '@/lib/posthog/scrubCaptureUrls.helper'

// posthog-js runs in the browser only. On the server, and in every run with
// no key, the app holds no client: nothing is initialised and no request
// leaves it.
const IS_BROWSER = typeof window !== 'undefined'

const initPostHog = ({
  consentMode,
  key
}: {
  consentMode: PostHogConsentModeType
  key: string
}): IPostHogClient => {
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
  return posthog
}

/**
 * The consent mode the client starts in. Read whenever a key is set, on the
 * server too, so an unknown value throws in the prerender of `next build` as
 * well as in the browser.
 */
export const posthogConsentMode: PostHogConsentModeType = POSTHOG_KEY
  ? resolveConsentMode({ value: POSTHOG_CONSENT })
  : PostHogConsentModeEnum.GRANTED

/**
 * The ONE PostHog client of this app, and the only file that imports the
 * SDK. Undefined without a key or outside the browser, so a caller guards
 * every call.
 */
export const posthogClient: IPostHogClient | undefined =
  POSTHOG_KEY && IS_BROWSER
    ? initPostHog({ consentMode: posthogConsentMode, key: POSTHOG_KEY })
    : undefined
