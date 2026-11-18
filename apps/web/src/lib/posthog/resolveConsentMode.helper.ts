import {
  POSTHOG_CONSENT_ENV_NAME,
  PostHogConsentModeEnum,
  type PostHogConsentModeType
} from '@/lib/posthog/posthogClient.constant'

const CONSENT_MODES: readonly PostHogConsentModeType[] = Object.values(
  PostHogConsentModeEnum
)

/**
 * The consent mode a setting names: `granted` when it is absent or empty.
 * Throws on any other value, a configuration error.
 */
export const resolveConsentMode = ({
  value
}: {
  value: string | undefined
}): PostHogConsentModeType => {
  if (!value) return PostHogConsentModeEnum.GRANTED
  const mode = CONSENT_MODES.find((known) => known === value)
  if (mode) return mode
  throw new Error(
    `${POSTHOG_CONSENT_ENV_NAME} must be one of ${CONSENT_MODES.join(', ')}; got "${value}".`
  )
}
