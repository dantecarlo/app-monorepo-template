// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { AppError } from './AppError.helper'

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

const HTTP_STATUS_FORBIDDEN = 403
const HTTP_STATUS_NOT_FOUND = 404
const HTTP_STATUS_SERVER_MIN = 500

export interface IPostgrestErrorLike {
  code: string
  details: string | null
  hint: string | null
  message: string
  status?: number
}

const isPostgrestErrorLike = (
  value: unknown
): value is IPostgrestErrorLike => {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.message === 'string' &&
    typeof candidate.code === 'string' &&
    'details' in candidate &&
    'hint' in candidate
  )
}

const codeFromHttpStatus = (
  status: number | undefined
): ServiceErrorCodeType | null => {
  if (status === undefined) return null
  if (status === HTTP_STATUS_FORBIDDEN) {
    return ServiceErrorCodeEnum.FORBIDDEN
  }
  if (status === HTTP_STATUS_NOT_FOUND) {
    return ServiceErrorCodeEnum.NOT_FOUND
  }
  if (status >= HTTP_STATUS_SERVER_MIN) {
    return ServiceErrorCodeEnum.SERVER_ERROR
  }
  return null
}

export interface IBuildServiceErrorParams {
  error: unknown
}

export const buildServiceError = ({
  error
}: IBuildServiceErrorParams): AppError => {
  if (error instanceof AppError) return error

  if (isPostgrestErrorLike(error)) {
    const code =
      codeFromHttpStatus(error.status) ?? ServiceErrorCodeEnum.UNKNOWN
    return new AppError({
      cause: error,
      code,
      messageKey: SERVICE_ERROR_MESSAGE_KEY_BY_CODE[code]
    })
  }

  return new AppError({
    cause: error,
    code: ServiceErrorCodeEnum.UNKNOWN,
    messageKey:
      SERVICE_ERROR_MESSAGE_KEY_BY_CODE[ServiceErrorCodeEnum.UNKNOWN]
  })
}
