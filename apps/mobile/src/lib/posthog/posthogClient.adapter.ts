import { PostHog } from 'posthog-react-native'

import { createConsentStorage } from '@/lib/posthog/consentStorage.adapter'
import type { IPostHogConsentStorage } from '@/lib/posthog/consentStorage.type'
import {
  POSTHOG_CONSENT,
  POSTHOG_CONSENT_OPTIONS_BY_MODE,
  POSTHOG_ERROR_TRACKING,
  POSTHOG_HOST,
  POSTHOG_KEY,
  PostHogConsentModeEnum,
  type PostHogConsentModeType
} from '@/lib/posthog/posthogClient.constant'
import type { IPostHogClient } from '@/lib/posthog/posthogClient.type'
import { resolveConsentMode } from '@/lib/posthog/resolveConsentMode.helper'

const createPostHogClient = ({
  consentMode,
  consentStorage,
  key
}: {
  consentMode: PostHogConsentModeType
  consentStorage: IPostHogConsentStorage | undefined
  key: string
}): IPostHogClient =>
  new PostHog(key, {
    // App lifecycle events are product analytics, not observability.
    captureAppLifecycleEvents: false,
    // Session replay records the screen; it stays off unless a project
    // turns it on here on purpose.
    enableSessionReplay: false,
    errorTracking: POSTHOG_ERROR_TRACKING,
    host: POSTHOG_HOST,
    ...POSTHOG_CONSENT_OPTIONS_BY_MODE[consentMode],
    ...(consentStorage && { customStorage: consentStorage })
  })

// A grant from an earlier launch opts the client in again, so it captures
// even when that launch stopped before PostHog saved its opt-in.
const optInAfterEarlierGrant = async ({
  client,
  consentStorage
}: {
  client: IPostHogClient
  consentStorage: IPostHogConsentStorage
}): Promise<void> => {
  if (await consentStorage.isGranted()) await client.optIn()
}

/**
 * The consent mode the client starts in, read whenever a key is set: an
 * unknown value throws when this module loads.
 */
export const posthogConsentMode: PostHogConsentModeType = POSTHOG_KEY
  ? resolveConsentMode({ value: POSTHOG_CONSENT })
  : PostHogConsentModeEnum.GRANTED

/**
 * The storage PostHog persists through in opt-in mode, which writes to the
 * device only after a grant. Undefined in every other mode and without a key.
 */
export const posthogConsentStorage: IPostHogConsentStorage | undefined =
  POSTHOG_KEY && posthogConsentMode === PostHogConsentModeEnum.OPT_IN
    ? createConsentStorage()
    : undefined

/**
 * The ONE PostHog client of this app, and the only file that imports the
 * SDK. Built only with a key, never as `new PostHog('')`, so without one
 * nothing is constructed and no request leaves the app; a caller guards
 * every call.
 */
export const posthogClient: IPostHogClient | undefined = POSTHOG_KEY
  ? createPostHogClient({
      consentMode: posthogConsentMode,
      consentStorage: posthogConsentStorage,
      key: POSTHOG_KEY
    })
  : undefined

if (posthogClient && posthogConsentStorage) {
  void optInAfterEarlierGrant({
    client: posthogClient,
    consentStorage: posthogConsentStorage
  })
}
