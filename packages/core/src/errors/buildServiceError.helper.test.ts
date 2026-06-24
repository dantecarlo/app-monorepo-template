import { describe, expect, test } from 'vitest'

import { AppError } from '@/errors/AppError.helper'
import {
  buildServiceError,
  type IPostgrestErrorLike,
  SERVICE_ERROR_MESSAGE_KEY_BY_CODE,
  ServiceErrorCodeEnum
} from '@/errors/buildServiceError.helper'

const HTTP_FORBIDDEN = 403
const HTTP_NOT_FOUND = 404
const HTTP_SERVER_ERROR = 500
const HTTP_BAD_GATEWAY = 502
const HTTP_BAD_REQUEST = 400

const makePostgrestError = (
  overrides: Partial<IPostgrestErrorLike> = {}
): IPostgrestErrorLike => ({
  code: 'PGRST000',
  details: null,
  hint: null,
  message: 'postgrest failure',
  ...overrides
})

describe('buildServiceError', () => {
  test('passes an existing AppError through unchanged', () => {
    const original = new AppError({
      code: ServiceErrorCodeEnum.FORBIDDEN,
      messageKey: 'helper.error.forbidden'
    })

    const result = buildServiceError({ error: original })

    expect(result).toBe(original)
  })

  test('maps a 403 PostgrestError to FORBIDDEN', () => {
    const result = buildServiceError({
      error: makePostgrestError({ status: HTTP_FORBIDDEN })
    })

    expect(result.code).toBe(ServiceErrorCodeEnum.FORBIDDEN)
    expect(result.messageKey).toBe('helper.error.forbidden')
  })

  test('maps a 404 PostgrestError to NOT_FOUND', () => {
    const result = buildServiceError({
      error: makePostgrestError({ status: HTTP_NOT_FOUND })
    })

    expect(result.code).toBe(ServiceErrorCodeEnum.NOT_FOUND)
    expect(result.messageKey).toBe('helper.error.notFound')
  })

  test('maps a 500 PostgrestError to SERVER_ERROR', () => {
    const result = buildServiceError({
      error: makePostgrestError({ status: HTTP_SERVER_ERROR })
    })

    expect(result.code).toBe(ServiceErrorCodeEnum.SERVER_ERROR)
    expect(result.messageKey).toBe('helper.error.server')
  })

  test('maps any 5xx PostgrestError to SERVER_ERROR', () => {
    const result = buildServiceError({
      error: makePostgrestError({ status: HTTP_BAD_GATEWAY })
    })

    expect(result.code).toBe(ServiceErrorCodeEnum.SERVER_ERROR)
  })

  test('maps an unrecognised 4xx PostgrestError to UNKNOWN', () => {
    const result = buildServiceError({
      error: makePostgrestError({ status: HTTP_BAD_REQUEST })
    })

    expect(result.code).toBe(ServiceErrorCodeEnum.UNKNOWN)
  })

  test('maps a PostgrestError without a status to UNKNOWN', () => {
    const result = buildServiceError({ error: makePostgrestError() })

    expect(result.code).toBe(ServiceErrorCodeEnum.UNKNOWN)
    expect(result.messageKey).toBe('helper.error.generic')
  })

  test('attaches the raw error as cause', () => {
    const raw = makePostgrestError({ status: HTTP_FORBIDDEN })

    const result = buildServiceError({ error: raw })

    expect((result as unknown as { cause: unknown }).cause).toBe(raw)
  })

  test('maps an unknown thrown value to UNKNOWN', () => {
    const result = buildServiceError({ error: 'boom' })

    expect(result.code).toBe(ServiceErrorCodeEnum.UNKNOWN)
    expect(result.messageKey).toBe('helper.error.generic')
  })

  test('maps a plain Error to UNKNOWN', () => {
    const result = buildServiceError({ error: new Error('plain') })

    expect(result.code).toBe(ServiceErrorCodeEnum.UNKNOWN)
  })

  test('always returns an AppError instance', () => {
    expect(buildServiceError({ error: null })).toBeInstanceOf(AppError)
  })

  test('exposes a message key for every service error code', () => {
    for (const code of Object.values(ServiceErrorCodeEnum)) {
      expect(SERVICE_ERROR_MESSAGE_KEY_BY_CODE[code]).toBeTruthy()
    }
  })
})
