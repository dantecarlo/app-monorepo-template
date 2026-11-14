import type {
  IAddBreadcrumbParams,
  ICaptureErrorParams,
  ICaptureMessageParams,
  IObservabilityPort,
  ISetUserParams
} from '#src/ports/observability/IObservabilityPort.type'
import { ObservabilityLevelEnum } from '#src/ports/observability/observabilityLevel.type'
import { hostConsole } from '#src/utils/hostConsole.helper'
import { scrubPII } from '#src/utils/scrubPII.helper'

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
    hostConsole.warn('[observability] addBreadcrumb', scrubbed)
  },

  captureError: ({ context, error }: ICaptureErrorParams): void => {
    if (!isEnabled) return
    const scrubbed = {
      context: context ? scrubPII(context) : undefined,
      error: scrubError(error)
    }
    hostConsole.error('[observability] captureError', scrubbed)
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
      hostConsole.error('[observability] captureMessage', scrubbed)
    } else {
      hostConsole.warn('[observability] captureMessage', scrubbed)
    }
  },

  setUser: ({ user }: ISetUserParams): void => {
    if (!isEnabled) return
    const scrubbed = user ? scrubPII(user) : null
    hostConsole.warn('[observability] setUser', scrubbed)
  }
})
