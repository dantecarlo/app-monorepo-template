import { AppError } from '@/../packages/core/src/errors/AppError.helper'
import type { IServiceErrorMapper } from '@/../packages/core/src/errors/IServiceErrorMapper.type'

export const ServiceErrorCodeEnum = {
  FORBIDDEN: 'FORBIDDEN',
  NETWORK_ERROR: 'NETWORK_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN'
} as const

export type ServiceErrorCodeType =
  (typeof ServiceErrorCodeEnum)[keyof typeof ServiceErrorCodeEnum]

export const SERVICE_ERROR_MESSAGE_KEY_BY_CODE: Record<
  ServiceErrorCodeType,
  string
> = {
  FORBIDDEN: 'helper.error.forbidden',
  NETWORK_ERROR: 'helper.error.network',
  NOT_FOUND: 'helper.error.notFound',
  SERVER_ERROR: 'helper.error.server',
  UNKNOWN: 'helper.error.generic'
}

export interface IBuildServiceErrorParams {
  error: unknown
  mapper?: IServiceErrorMapper
}

export const buildServiceError = ({
  error,
  mapper
}: IBuildServiceErrorParams): AppError => {
  if (error instanceof AppError) return error

  if (mapper !== undefined) {
    const mapped = mapper.mapError({ error })
    if (mapped !== null) {
      return new AppError({
        cause: error,
        code: mapped,
        messageKey: SERVICE_ERROR_MESSAGE_KEY_BY_CODE[mapped]
      })
    }
  }

  return new AppError({
    cause: error,
    code: ServiceErrorCodeEnum.UNKNOWN,
    messageKey:
      SERVICE_ERROR_MESSAGE_KEY_BY_CODE[ServiceErrorCodeEnum.UNKNOWN]
  })
}
