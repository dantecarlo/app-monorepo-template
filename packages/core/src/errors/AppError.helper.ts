export const APP_ERROR_CODES = {
  NETWORK: 'NETWORK',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  UNKNOWN: 'UNKNOWN',
  VALIDATION: 'VALIDATION'
} as const

export type AppErrorCodeType = keyof typeof APP_ERROR_CODES

export interface IAppErrorParams {
  cause?: unknown
  code: string
  messageKey?: string
}

export class AppError extends Error {
  readonly code: string
  readonly messageKey?: string

  constructor({ cause, code, messageKey }: IAppErrorParams) {
    super(code)
    this.name = 'AppError'
    this.code = code
    this.messageKey = messageKey

    if (cause !== undefined) {
      ;(this as unknown as { cause: unknown }).cause = cause
    }

    Object.setPrototypeOf(this, AppError.prototype)
  }
}
