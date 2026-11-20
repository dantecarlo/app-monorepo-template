import {
  ConsentStatusEnum,
  type ConsentStatusType,
  type IConsentPort
} from '@app/core'

import {
  POSTHOG_FLAGS_PAUSED,
  POSTHOG_FLAGS_RESUMED,
  POSTHOG_OPT_IN_OPTIONS,
  POSTHOG_REVOKE_RESET_OPTIONS
} from '@/lib/observability/createPostHogConsent.constant'
import {
  hasGrantRecord,
  removeGrantRecord,
  writeGrantRecord
} from '@/lib/posthog/grantRecord.adapter'
import {
  isPostHogAvailable,
  posthogClient,
  posthogConsentMode,
  startPostHogClient
} from '@/lib/posthog/posthogClient.adapter'
import { PostHogConsentModeEnum } from '@/lib/posthog/posthogClient.constant'

/**
 * PostHog adapter for IConsentPort, the default of the consent composition
 * root. Only the opt-in mode asks consent. A grant loads the SDK, opts it in
 * and records the grant for the next visit; the status reads granted for
 * this page even when the browser blocks the record. A revoke removes the
 * record and stops the client at once, so no call made from then on reaches
 * PostHog, then opts out the SDK it loaded or a load in flight brings, pauses
 * its flags and resets it, which clears every value it stored and its choice
 * and, with the flags paused, requests none, so the refusal holds for this
 * page only. A grant after a revoke resumes the flags and reloads them once.
 * When a revoke and a grant overlap a load, the later one decides. In any
 * other mode, and while the app may not load PostHog, every call changes
 * nothing and the status is not-required.
 */
export const createPostHogConsent = (): IConsentPort => {
  const isAsked =
    isPostHogAvailable &&
    posthogConsentMode === PostHogConsentModeEnum.OPT_IN
  const choice = {
    count: 0,
    isFlagsPaused: false,
    isGranted: false,
    isRevoked: false
  }

  return {
    getStatus: async (): Promise<ConsentStatusType> => {
      if (!isAsked) return ConsentStatusEnum.NOT_REQUIRED
      if (choice.isRevoked) return ConsentStatusEnum.DENIED
      return choice.isGranted || hasGrantRecord()
        ? ConsentStatusEnum.GRANTED
        : ConsentStatusEnum.PENDING
    },

    grant: async (): Promise<void> => {
      if (!isAsked) return
      choice.count += 1
      const made = choice.count
      choice.isRevoked = false
      const client = await startPostHogClient()
      if (!client || made !== choice.count) return
      client.opt_in_capturing(POSTHOG_OPT_IN_OPTIONS)
      if (choice.isFlagsPaused) {
        choice.isFlagsPaused = false
        client.set_config(POSTHOG_FLAGS_RESUMED)
        client.reloadFeatureFlags()
      }
      choice.isGranted = true
      writeGrantRecord()
    },

    revoke: async (): Promise<void> => {
      if (!isAsked) return
      choice.count += 1
      const made = choice.count
      choice.isGranted = false
      choice.isRevoked = true
      removeGrantRecord()
      const client = await posthogClient.stop()
      if (!client || made !== choice.count) return
      client.opt_out_capturing()
      client.set_config(POSTHOG_FLAGS_PAUSED)
      choice.isFlagsPaused = true
      client.reset(POSTHOG_REVOKE_RESET_OPTIONS)
    }
  }
}
