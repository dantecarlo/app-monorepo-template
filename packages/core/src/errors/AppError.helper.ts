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
