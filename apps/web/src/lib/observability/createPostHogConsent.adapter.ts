import {
  ConsentStatusEnum,
  type ConsentStatusType,
  type IConsentPort
} from '@app/core'

import {
  CONSENT_STATUS_BY_POSTHOG_CONSENT,
  POSTHOG_OPT_IN_OPTIONS,
  POSTHOG_REVOKE_RESET_OPTIONS
} from '@/lib/observability/createPostHogConsent.constant'
import {
  posthogClient,
  posthogConsentMode
} from '@/lib/posthog/posthogClient.adapter'
import { PostHogConsentModeEnum } from '@/lib/posthog/posthogClient.constant'

/**
 * PostHog adapter for IConsentPort, the default of the consent composition
 * root. Only the opt-in mode asks consent: a grant opts PostHog in, and a
 * revoke opts it out and resets it, which clears every value it stored and
 * the stored choice, so the refusal holds for this page only. In any other
 * mode, and while the app holds no client, every call changes nothing and the
 * status is not-required.
 */
export const createPostHogConsent = (): IConsentPort => {
  const client =
    posthogConsentMode === PostHogConsentModeEnum.OPT_IN
      ? posthogClient
      : undefined
  const choice = { isRevoked: false }

  return {
    getStatus: async (): Promise<ConsentStatusType> => {
      if (!client) return ConsentStatusEnum.NOT_REQUIRED
      const status =
        CONSENT_STATUS_BY_POSTHOG_CONSENT[
          client.get_explicit_consent_status()
        ]
      return status === ConsentStatusEnum.PENDING && choice.isRevoked
        ? ConsentStatusEnum.DENIED
        : status
    },

    grant: async (): Promise<void> => {
      if (!client) return
      choice.isRevoked = false
      client.opt_in_capturing(POSTHOG_OPT_IN_OPTIONS)
    },

    revoke: async (): Promise<void> => {
      if (!client) return
      choice.isRevoked = true
      client.opt_out_capturing()
      client.reset(POSTHOG_REVOKE_RESET_OPTIONS)
    }
  }
}
