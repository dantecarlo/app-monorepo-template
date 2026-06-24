import { describe, expect, test, vi } from 'vitest'

import { AppError } from '@/errors/AppError.helper'
import {
  buildServiceError,
  SERVICE_ERROR_MESSAGE_KEY_BY_CODE,
  ServiceErrorCodeEnum
} from '@/errors/buildServiceError.helper'
import type { IServiceErrorMapper } from '@/errors/IServiceErrorMapper.type'

describe('buildServiceError', () => {
  test('passes an existing AppError through unchanged', () => {
    const original = new AppError({
      code: ServiceErrorCodeEnum.FORBIDDEN,
      messageKey: 'helper.error.forbidden'
    })

    const result = buildServiceError({ error: original })

    expect(result).toBe(original)
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

  test('delegates to the injected mapper when provided', () => {
    const mapper: IServiceErrorMapper = {
      mapError: vi.fn().mockReturnValue(ServiceErrorCodeEnum.FORBIDDEN)
    }

    const result = buildServiceError({ error: new Error('any'), mapper })

    expect(mapper.mapError).toHaveBeenCalledWith({
      error: expect.any(Error)
    })
    expect(result.code).toBe(ServiceErrorCodeEnum.FORBIDDEN)
    expect(result.messageKey).toBe('helper.error.forbidden')
  })

  test('falls back to UNKNOWN when the mapper returns null', () => {
    const mapper: IServiceErrorMapper = {
      mapError: vi.fn().mockReturnValue(null)
    }

    const result = buildServiceError({ error: new Error('any'), mapper })

    expect(result.code).toBe(ServiceErrorCodeEnum.UNKNOWN)
  })

  test('uses the mapper-returned code to look up the message key', () => {
    const mapper: IServiceErrorMapper = {
      mapError: vi.fn().mockReturnValue(ServiceErrorCodeEnum.NOT_FOUND)
    }

    const result = buildServiceError({ error: {}, mapper })

    expect(result.messageKey).toBe('helper.error.notFound')
  })

  test('attaches the raw error as cause when the mapper maps it', () => {
    const raw = new Error('provider error')
    const mapper: IServiceErrorMapper = {
      mapError: vi.fn().mockReturnValue(ServiceErrorCodeEnum.SERVER_ERROR)
    }

    const result = buildServiceError({ error: raw, mapper })

    expect((result as unknown as { cause: unknown }).cause).toBe(raw)
  })
})
