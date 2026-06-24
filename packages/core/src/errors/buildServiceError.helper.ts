import { AppError } from '@/errors/AppError.helper'
import type { IServiceErrorMapper } from '@/errors/IServiceErrorMapper.type'
import {
  SERVICE_ERROR_MESSAGE_KEY_BY_CODE,
  ServiceErrorCodeEnum
} from '@/errors/serviceError.type'

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
