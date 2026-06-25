import {
  type IAddBreadcrumbParams,
  type ICaptureErrorParams,
  type ICaptureMessageParams,
  type IObservabilityPort,
  type ISetUserParams,
  ObservabilityLevelEnum,
  type ObservabilityLevelType,
  scrubPII
} from '@app/core'
import * as Sentry from '@sentry/nextjs'

const SEVERITY_BY_LEVEL: Record<
  ObservabilityLevelType,
  Sentry.SeverityLevel
> = {
  [ObservabilityLevelEnum.DEBUG]: 'debug',
  [ObservabilityLevelEnum.ERROR]: 'error',
  [ObservabilityLevelEnum.FATAL]: 'fatal',
  [ObservabilityLevelEnum.INFO]: 'info',
  [ObservabilityLevelEnum.WARNING]: 'warning'
}

const isEnabled = (): boolean => !!process.env.NEXT_PUBLIC_SENTRY_DSN

export const createSentryObservability = (): IObservabilityPort => ({
  addBreadcrumb: ({
    category,
    data,
    level = ObservabilityLevelEnum.INFO,
    message
  }: IAddBreadcrumbParams): void => {
    if (!isEnabled()) return
    Sentry.addBreadcrumb({
      category,
      data: data ? scrubPII(data) : undefined,
      level: SEVERITY_BY_LEVEL[level],
      message
    })
  },

  captureError: ({ context, error }: ICaptureErrorParams): void => {
    if (!isEnabled()) return
    Sentry.captureException(error, {
      extra: context ? scrubPII(context) : undefined
    })
  },

  captureMessage: ({
    context,
    level = ObservabilityLevelEnum.INFO,
    message
  }: ICaptureMessageParams): void => {
    if (!isEnabled()) return
    Sentry.captureMessage(message, {
      extra: context ? scrubPII(context) : undefined,
      level: SEVERITY_BY_LEVEL[level]
    })
  },

  setUser: ({ user }: ISetUserParams): void => {
    if (!isEnabled()) return
    Sentry.setUser(user ? scrubPII(user) : null)
  }
})
