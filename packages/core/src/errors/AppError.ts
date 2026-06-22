export const APP_ERROR_CODES = {
  NETWORK: 'NETWORK',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  UNKNOWN: 'UNKNOWN',
  VALIDATION: 'VALIDATION'
} as const

export type AppErrorCodeType = keyof typeof APP_ERROR_CODES

export class AppError extends Error {
  readonly code: AppErrorCodeType

  constructor({
    code,
    message
  }: {
    code: AppErrorCodeType
    message: string
  }) {
    super(message)
    this.code = code
    this.name = 'AppError'
  }
}
