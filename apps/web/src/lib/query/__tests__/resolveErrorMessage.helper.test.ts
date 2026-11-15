import { AppError } from '@app/core'
import { describe, expect, test } from 'vitest'

import { resolveErrorMessage } from '@/lib/query/resolveErrorMessage.helper'

const GENERIC_FALLBACK = 'fallback'

const KNOWN_KEY = 'helper.error.notFound'
const KNOWN_MESSAGE = 'Not found'

const translate = (key: string): string =>
  key === KNOWN_KEY ? KNOWN_MESSAGE : key

const hasKey = (key: string): boolean => key === KNOWN_KEY

describe('resolveErrorMessage', () => {
  test('prefers the explicit errorMessage override', () => {
    const result = resolveErrorMessage({
      error: new AppError({ code: 'X', messageKey: KNOWN_KEY }),
      errorMessage: 'override',
      fallback: GENERIC_FALLBACK,
      hasKey,
      translate
    })

    expect(result).toBe('override')
  })

  test('resolves AppError.messageKey via i18n when no override', () => {
    const result = resolveErrorMessage({
      error: new AppError({ code: 'X', messageKey: KNOWN_KEY }),
      fallback: GENERIC_FALLBACK,
      hasKey,
      translate
    })

    expect(result).toBe(KNOWN_MESSAGE)
  })

  test('falls back to error.message when the key is missing from catalog', () => {
    const result = resolveErrorMessage({
      error: new AppError({
        code: 'X',
        messageKey: 'helper.error.unknownKey'
      }),
      fallback: GENERIC_FALLBACK,
      hasKey,
      translate
    })

    expect(result).toBe('X')
  })

  test('falls back to error.message for a plain Error', () => {
    const result = resolveErrorMessage({
      error: new Error('network down'),
      fallback: GENERIC_FALLBACK,
      hasKey,
      translate
    })

    expect(result).toBe('network down')
  })

  test('uses the generic fallback for a non-Error value', () => {
    const result = resolveErrorMessage({
      error: 'oops',
      fallback: GENERIC_FALLBACK,
      hasKey,
      translate
    })

    expect(result).toBe(GENERIC_FALLBACK)
  })
})
