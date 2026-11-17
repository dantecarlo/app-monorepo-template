import { PostHog } from 'posthog-react-native'

import {
  POSTHOG_ERROR_TRACKING,
  POSTHOG_HOST,
  POSTHOG_KEY
} from '@/lib/posthog/posthogClient.constant'
import type { IPostHogClient } from '@/lib/posthog/posthogClient.type'

const createPostHogClient = ({ key }: { key: string }): IPostHogClient =>
  new PostHog(key, {
    // App lifecycle events are product analytics, not observability.
    captureAppLifecycleEvents: false,
    // Session replay records the screen; it stays off unless a project
    // turns it on here on purpose.
    enableSessionReplay: false,
    errorTracking: POSTHOG_ERROR_TRACKING,
    host: POSTHOG_HOST
  })

/**
 * The ONE PostHog client of this app, and the only file that imports the
 * SDK. Built only with a key, never as `new PostHog('')`, so without one
 * nothing is constructed and no request leaves the app; a caller guards
 * every call.
 */
export const posthogClient: IPostHogClient | undefined = POSTHOG_KEY
  ? createPostHogClient({ key: POSTHOG_KEY })
  : undefined
