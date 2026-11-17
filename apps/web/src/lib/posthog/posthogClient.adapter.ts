import posthog from 'posthog-js'

import {
  POSTHOG_EXCEPTION_AUTOCAPTURE,
  POSTHOG_HOST,
  POSTHOG_KEY
} from '@/lib/posthog/posthogClient.constant'
import type { IPostHogClient } from '@/lib/posthog/posthogClient.type'
import { scrubCaptureUrls } from '@/lib/posthog/scrubCaptureUrls.helper'

// posthog-js runs in the browser only. On the server, and in every run with
// no key, the app holds no client: nothing is initialised and no request
// leaves it.
const IS_BROWSER = typeof window !== 'undefined'

const initPostHog = ({ key }: { key: string }): IPostHogClient => {
  posthog.init(key, {
    api_host: POSTHOG_HOST,
    // DOM autocapture is off, form inputs included, and so are dead clicks,
    // which describe the clicked element the same way.
    autocapture: false,
    before_send: scrubCaptureUrls,
    capture_dead_clicks: false,
    capture_exceptions: POSTHOG_EXCEPTION_AUTOCAPTURE,
    disable_session_recording: true
  })
  return posthog
}

/**
 * The ONE PostHog client of this app, and the only file that imports the
 * SDK. Undefined without a key or outside the browser, so a caller guards
 * every call.
 */
export const posthogClient: IPostHogClient | undefined =
  POSTHOG_KEY && IS_BROWSER ? initPostHog({ key: POSTHOG_KEY }) : undefined
