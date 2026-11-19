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

// An id PostHog can identify: a string with a character other than
// whitespace. The SDKs disagree on a blank one: posthog-js refuses it,
// posthog-react-native sets the person properties on the anonymous id.
const isIdentifiableId = ({ id }: { id: unknown }): boolean =>
  typeof id === 'string' && id.trim() !== ''

/**
 * PostHog adapter for IObservabilityPort, the default of the composition
 * root. An error is a PostHog exception, a message a PostHog log record, a
 * breadcrumb an exception step that rides with the next exception, and the
 * user an identify by id, never by a blank id, which identifies nobody; every
 * payload passes through scrubPII when the method is called. The client makes each call at once while the SDK is
 * loaded, holds it while the SDK loads, and drops it while nothing is
 * loading: without a key, on the server, and in opt-in mode without a grant.
 */
export const createPostHogObservability = (): IObservabilityPort => ({
  addBreadcrumb: ({
    category,
    data,
    level = ObservabilityLevelEnum.INFO,
    message
  }: IAddBreadcrumbParams): void => {
    const properties = scrubPII({ ...data, category, level })
    posthogClient.run((client) =>
      client.addExceptionStep(message, properties)
    )
  },

  captureError: ({ context, error }: ICaptureErrorParams): void => {
    const properties = context ? scrubPII(context) : undefined
    posthogClient.run((client) => {
      client.captureException(error, properties)
    })
  },

  captureMessage: ({
    context,
    level = ObservabilityLevelEnum.INFO,
    message
  }: ICaptureMessageParams): void => {
    const record = {
      attributes: context ? scrubPII(context) : undefined,
      body: message,
      level: POSTHOG_LOG_LEVEL_BY_LEVEL[level]
    }
    posthogClient.run((client) => client.captureLog(record))
  },

  setUser: ({ user }: ISetUserParams): void => {
    if (!user) {
      posthogClient.run((client) => client.reset())
      return
    }
    const { id, ...properties } = user
    if (!isIdentifiableId({ id })) return
    const scrubbed =
      Object.keys(properties).length > 0 ? scrubPII(properties) : undefined
    posthogClient.run((client) => client.identify(id, scrubbed))
  }
})
