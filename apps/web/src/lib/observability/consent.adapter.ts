import type { IConsentPort } from '@app/core'

import { createPostHogConsent } from '@/lib/observability/createPostHogConsent.adapter'

// The consent composition root: the one line that picks whose consent a
// banner asks for. PostHog's, the provider observability.adapter.ts binds.
export const consent: IConsentPort = createPostHogConsent()
