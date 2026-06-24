// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { AppError } from './AppError.helper'
// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import type { IServiceErrorMapper } from './IServiceErrorMapper.type'
// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import {
  SERVICE_ERROR_MESSAGE_KEY_BY_CODE,
  ServiceErrorCodeEnum
} from './serviceError.type'

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
