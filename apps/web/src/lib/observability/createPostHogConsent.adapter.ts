import {
  ConsentStatusEnum,
  type ConsentStatusType,
  type IConsentPort
} from '@app/core'

import {
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
 * and records the grant for the next visit. A revoke waits for a load in
 * flight, removes the record and stops the client, then opts a loaded SDK
 * out and resets it, which clears every value it stored and its choice, so
 * the refusal holds for this page only. When a revoke and a grant overlap a
 * load, the later one decides. In any other mode, and while the app may not
 * load PostHog, every call changes nothing and the status is not-required.
 */
export const createPostHogConsent = (): IConsentPort => {
  const isAsked =
    isPostHogAvailable &&
    posthogConsentMode === PostHogConsentModeEnum.OPT_IN
  const choice = { count: 0, isRevoked: false }

  return {
    getStatus: async (): Promise<ConsentStatusType> => {
      if (!isAsked) return ConsentStatusEnum.NOT_REQUIRED
      if (hasGrantRecord()) return ConsentStatusEnum.GRANTED
      return choice.isRevoked
        ? ConsentStatusEnum.DENIED
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
      writeGrantRecord()
    },

    revoke: async (): Promise<void> => {
      if (!isAsked) return
      choice.count += 1
      const made = choice.count
      choice.isRevoked = true
      const client = await posthogClient.settled()
      if (made !== choice.count) return
      removeGrantRecord()
      posthogClient.stop()
      if (!client) return
      client.opt_out_capturing()
      client.reset(POSTHOG_REVOKE_RESET_OPTIONS)
    }
  }
}
