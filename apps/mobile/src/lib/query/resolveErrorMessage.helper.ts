import { AppError } from '@app/core'

export interface IResolveErrorMessageParams {
  error: unknown
  errorMessage?: string
  fallback: string
  hasKey: (key: string) => boolean
  translate: (key: string) => string
}

export const resolveErrorMessage = ({
  error,
  errorMessage,
  fallback,
  hasKey,
  translate
}: IResolveErrorMessageParams): string => {
  if (errorMessage) return errorMessage

  if (
    error instanceof AppError &&
    error.messageKey &&
    hasKey(error.messageKey)
  ) {
    return translate(error.messageKey)
  }

  if (error instanceof Error && error.message) return error.message

  return fallback
}
