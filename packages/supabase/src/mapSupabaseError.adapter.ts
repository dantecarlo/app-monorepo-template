import {
  type IServiceErrorMapper,
  ServiceErrorCodeEnum,
  type ServiceErrorCodeType
} from '@app/core'

interface IPostgrestErrorLike {
  code: string
  details: string | null
  hint: string | null
  message: string
  status?: number
}

const HTTP_STATUS_FORBIDDEN = 403
const HTTP_STATUS_NOT_FOUND = 404
const HTTP_STATUS_SERVER_MIN = 500

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
  if (status === HTTP_STATUS_FORBIDDEN)
    return ServiceErrorCodeEnum.FORBIDDEN
  if (status === HTTP_STATUS_NOT_FOUND)
    return ServiceErrorCodeEnum.NOT_FOUND
  if (status >= HTTP_STATUS_SERVER_MIN)
    return ServiceErrorCodeEnum.SERVER_ERROR
  return null
}

export const mapSupabaseError: IServiceErrorMapper = {
  mapError: ({ error }) => {
    if (!isPostgrestErrorLike(error)) return null
    return codeFromHttpStatus(error.status) ?? ServiceErrorCodeEnum.UNKNOWN
  }
}
