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
import * as Sentry from '@sentry/react-native'

type SentrySeverityType = 'debug' | 'error' | 'fatal' | 'info' | 'warning'

const SEVERITY_BY_LEVEL: Record<
  ObservabilityLevelType,
  SentrySeverityType
> = {
  [ObservabilityLevelEnum.DEBUG]: 'debug',
  [ObservabilityLevelEnum.ERROR]: 'error',
  [ObservabilityLevelEnum.FATAL]: 'fatal',
  [ObservabilityLevelEnum.INFO]: 'info',
  [ObservabilityLevelEnum.WARNING]: 'warning'
}

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN

const isEnabled = (): boolean => !!dsn

Sentry.init({
  dsn,
  enabled: isEnabled(),
  environment: process.env.EXPO_PUBLIC_APP_ENV ?? 'development'
})

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
