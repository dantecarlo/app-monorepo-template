/* eslint-disable no-relative-import-paths/no-relative-import-paths */
import { scrubPII } from '../../utils/scrubPII.helper'
import type {
  IAddBreadcrumbParams,
  ICaptureErrorParams,
  ICaptureMessageParams,
  IObservabilityPort,
  ISetUserParams
} from './IObservabilityPort.type'
import { ObservabilityLevelEnum } from './observabilityLevel.type'
/* eslint-enable no-relative-import-paths/no-relative-import-paths */

export interface ICreateConsoleObservabilityParams {
  isEnabled?: boolean
}

const scrubError = (error: unknown): Record<string, unknown> => {
  if (error instanceof Error) {
    return scrubPII({ message: error.message, name: error.name })
  }
  return scrubPII({ message: String(error) })
}

export const createConsoleObservability = ({
  isEnabled = true
}: ICreateConsoleObservabilityParams = {}): IObservabilityPort => ({
  addBreadcrumb: ({
    category,
    data,
    level = ObservabilityLevelEnum.INFO,
    message
  }: IAddBreadcrumbParams): void => {
    if (!isEnabled) return
    const scrubbed = {
      category,
      data: data ? scrubPII(data) : undefined,
      level,
      message
    }
    console.warn('[observability] addBreadcrumb', scrubbed)
  },

  captureError: ({ context, error }: ICaptureErrorParams): void => {
    if (!isEnabled) return
    const scrubbed = {
      context: context ? scrubPII(context) : undefined,
      error: scrubError(error)
    }
    console.error('[observability] captureError', scrubbed)
  },

  captureMessage: ({
    context,
    level = ObservabilityLevelEnum.INFO,
    message
  }: ICaptureMessageParams): void => {
    if (!isEnabled) return
    const scrubbed = {
      context: context ? scrubPII(context) : undefined,
      level,
      message
    }
    if (
      level === ObservabilityLevelEnum.ERROR ||
      level === ObservabilityLevelEnum.FATAL
    ) {
      console.error('[observability] captureMessage', scrubbed)
    } else {
      console.warn('[observability] captureMessage', scrubbed)
    }
  },

  setUser: ({ user }: ISetUserParams): void => {
    if (!isEnabled) return
    const scrubbed = user ? scrubPII(user) : null
    console.warn('[observability] setUser', scrubbed)
  }
})
