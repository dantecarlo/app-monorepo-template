import {
  ConsentStatusEnum,
  type ConsentStatusType,
  type IConsentPort
} from '@app/core'

import { POSTHOG_REVOKE_KEPT_PROPERTIES } from '@/lib/observability/createPostHogConsent.constant'
import {
  posthogClient,
  posthogConsentStorage
} from '@/lib/posthog/posthogClient.adapter'

/**
 * PostHog adapter for IConsentPort, the default of the consent composition
 * root. Only the opt-in mode asks consent, and only it has a consent storage:
 * a grant opens the storage and then opts PostHog in; a revoke closes it,
 * which removes what PostHog stored, and then opts PostHog out and resets
 * it, so the refusal holds for this launch only. In any other mode, and
 * without a key, every call changes nothing and the status is not-required.
 */
export const createPostHogConsent = (): IConsentPort => {
  const consentStorage = posthogConsentStorage
  const client = consentStorage && posthogClient
  const choice = { isRevoked: false }

  return {
    getStatus: async (): Promise<ConsentStatusType> => {
      if (!client || !consentStorage) return ConsentStatusEnum.NOT_REQUIRED
      if (await consentStorage.isGranted())
        return ConsentStatusEnum.GRANTED
      return choice.isRevoked
        ? ConsentStatusEnum.DENIED
        : ConsentStatusEnum.PENDING
    },

    grant: async (): Promise<void> => {
      if (!client || !consentStorage) return
      choice.isRevoked = false
      await consentStorage.open()
      await client.optIn()
    },

    revoke: async (): Promise<void> => {
      if (!client || !consentStorage) return
      choice.isRevoked = true
      await consentStorage.close()
      await client.optOut()
      client.reset(POSTHOG_REVOKE_KEPT_PROPERTIES)
    }
  }
}
