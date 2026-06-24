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
