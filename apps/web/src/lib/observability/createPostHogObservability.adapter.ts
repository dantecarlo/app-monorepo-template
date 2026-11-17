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
import { posthogClient } from '@/lib/posthog/posthogClient.adapter'

/**
 * PostHog adapter for IObservabilityPort, the default of the composition
 * root. An error is a PostHog exception, a message a PostHog log record, a
 * breadcrumb an exception step that rides with the next exception, and the
 * user an identify by id; every payload passes through scrubPII first.
 * Every method is a no-op while the app holds no PostHog client.
 */
export const createPostHogObservability = (): IObservabilityPort => ({
  addBreadcrumb: ({
    category,
    data,
    level = ObservabilityLevelEnum.INFO,
    message
  }: IAddBreadcrumbParams): void => {
    if (!posthogClient) return
    posthogClient.addExceptionStep(
      message,
      scrubPII({ ...data, category, level })
    )
  },

  captureError: ({ context, error }: ICaptureErrorParams): void => {
    if (!posthogClient) return
    posthogClient.captureException(
      error,
      context ? scrubPII(context) : undefined
    )
  },

  captureMessage: ({
    context,
    level = ObservabilityLevelEnum.INFO,
    message
  }: ICaptureMessageParams): void => {
    if (!posthogClient) return
    posthogClient.captureLog({
      attributes: context ? scrubPII(context) : undefined,
      body: message,
      level: POSTHOG_LOG_LEVEL_BY_LEVEL[level]
    })
  },

  setUser: ({ user }: ISetUserParams): void => {
    if (!posthogClient) return
    if (!user) {
      posthogClient.reset()
      return
    }
    const { id, ...properties } = user
    posthogClient.identify(
      id,
      Object.keys(properties).length > 0 ? scrubPII(properties) : undefined
    )
  }
})
