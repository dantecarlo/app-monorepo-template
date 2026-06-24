import { scrubPII } from '../../utils/scrubPII.helper'
// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import type {
  ICaptureErrorParams,
  ICaptureMessageParams,
  IObservabilityPort
} from './IObservabilityPort.type'
// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { ObservabilityLevelEnum } from './observabilityLevel.type'

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
  }
})
