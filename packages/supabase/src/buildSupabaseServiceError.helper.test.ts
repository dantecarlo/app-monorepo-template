import { AppError, ServiceErrorCodeEnum } from '@app/core'
import { describe, expect, test } from 'vitest'

import { buildSupabaseServiceError } from '@/buildSupabaseServiceError.helper'

const HTTP_FORBIDDEN = 403

describe('buildSupabaseServiceError', () => {
  test('maps a Postgrest 403 to FORBIDDEN via the injected mapper', () => {
    const result = buildSupabaseServiceError({
      error: {
        code: 'PGRST000',
        details: null,
        hint: null,
        message: 'forbidden',
        status: HTTP_FORBIDDEN
      }
    })

    expect(result.code).toBe(ServiceErrorCodeEnum.FORBIDDEN)
    expect(result.messageKey).toBe('helper.error.forbidden')
  })

  test('passes an AppError through unchanged', () => {
    const original = new AppError({
      code: ServiceErrorCodeEnum.UNKNOWN,
      messageKey: 'helper.error.generic'
    })

    expect(buildSupabaseServiceError({ error: original })).toBe(original)
  })

  test('maps an unrecognised error to UNKNOWN', () => {
    const result = buildSupabaseServiceError({ error: new Error('plain') })

    expect(result.code).toBe(ServiceErrorCodeEnum.UNKNOWN)
  })

  test('always returns an AppError instance', () => {
    expect(buildSupabaseServiceError({ error: null })).toBeInstanceOf(
      AppError
    )
  })
})
