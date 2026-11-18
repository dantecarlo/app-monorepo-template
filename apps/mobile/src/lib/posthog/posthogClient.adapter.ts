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

// The ONE PostHog client of this app, while one exists.
const current: { client?: IPostHogClient } = {}

/** The client, or undefined while none exists: a caller guards every call. */
export const getPostHogClient = (): IPostHogClient | undefined =>
  current.client

/**
 * Constructs the client once and returns it; undefined without a key, never
 * as `new PostHog('')`, so without one nothing is constructed and no request
 * leaves the app. The app starts it at launch in `granted` and `memory`
 * mode; in `opt-in` mode a grant starts it, or a grant from an earlier
 * launch at launch.
 */
export const startPostHogClient = (): IPostHogClient | undefined => {
  if (!POSTHOG_KEY) return undefined
  current.client ??= createPostHogClient({
    consentMode: posthogConsentMode,
    consentStorage: posthogConsentStorage,
    key: POSTHOG_KEY
  })
  return current.client
}

/** Drops the client; a later start constructs a new one. */
export const stopPostHogClient = (): void => {
  current.client = undefined
}

// A grant from an earlier launch starts the client and opts it in again, so
// it captures even when that launch stopped before PostHog saved its opt-in.
const startAfterEarlierGrant = async ({
  consentStorage
}: {
  consentStorage: IPostHogConsentStorage
}): Promise<void> => {
  if (!(await consentStorage.isGranted())) return
  await startPostHogClient()?.optIn()
}

if (POSTHOG_KEY && posthogConsentMode !== PostHogConsentModeEnum.OPT_IN) {
  startPostHogClient()
}

if (posthogConsentStorage) {
  void startAfterEarlierGrant({ consentStorage: posthogConsentStorage })
}
