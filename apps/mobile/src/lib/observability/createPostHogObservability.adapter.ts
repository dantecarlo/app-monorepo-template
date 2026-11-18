import {
  type IAddBreadcrumbParams,
  type ICaptureErrorParams,
  type ICaptureMessageParams,
  type IObservabilityPort,
  type ISetUserParams,
  ObservabilityLevelEnum,
  scrubPII
} from '@app/core'

import { POSTHOG_LOG_LEVEL_BY_LEVEL } from '@/lib/observability/createPostHogObservability.constant'
import { getPostHogClient } from '@/lib/posthog/posthogClient.adapter'

/**
 * PostHog adapter for IObservabilityPort, the default of the composition
 * root. An error is a PostHog exception, a message a PostHog log record, a
 * breadcrumb an exception step that rides with the next exception, and the
 * user an identify by id; every payload passes through scrubPII first.
 * Every method is a no-op while the app holds no PostHog client: without a
 * key, and in opt-in mode before a grant and after a revoke. Nothing is held
 * for a later client.
 */
export const createPostHogObservability = (): IObservabilityPort => ({
  addBreadcrumb: ({
    category,
    data,
    level = ObservabilityLevelEnum.INFO,
    message
  }: IAddBreadcrumbParams): void => {
    const client = getPostHogClient()
    if (!client) return
    client.addExceptionStep(
      message,
      scrubPII({ ...data, category, level })
    )
  },

  captureError: ({ context, error }: ICaptureErrorParams): void => {
    const client = getPostHogClient()
    if (!client) return
    client.captureException(error, context ? scrubPII(context) : undefined)
  },

  captureMessage: ({
    context,
    level = ObservabilityLevelEnum.INFO,
    message
  }: ICaptureMessageParams): void => {
    const client = getPostHogClient()
    if (!client) return
    client.captureLog({
      attributes: context ? scrubPII(context) : undefined,
      body: message,
      level: POSTHOG_LOG_LEVEL_BY_LEVEL[level]
    })
  },

  setUser: ({ user }: ISetUserParams): void => {
    const client = getPostHogClient()
    if (!client) return
    if (!user) {
      client.reset()
      return
    }
    const { id, ...properties } = user
    client.identify(
      id,
      Object.keys(properties).length > 0 ? scrubPII(properties) : undefined
    )
  }
})
