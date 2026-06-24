import { describe, expect, test } from 'vitest'

import { AppError } from '@/errors/AppError.helper'

describe('AppError', () => {
  test('sets code on the instance', () => {
    const err = new AppError({ code: 'UNKNOWN' })
    expect(err.code).toBe('UNKNOWN')
  })

  test('name is always "AppError"', () => {
    const err = new AppError({ code: 'UNKNOWN' })
    expect(err.name).toBe('AppError')
  })

  test('message equals the code string', () => {
    const err = new AppError({ code: 'NETWORK_ERROR' })
    expect(err.message).toBe('NETWORK_ERROR')
  })

  test('messageKey is undefined when not provided', () => {
    const err = new AppError({ code: 'UNKNOWN' })
    expect(err.messageKey).toBeUndefined()
  })

  test('messageKey is set when provided', () => {
    const err = new AppError({
      code: 'NOT_FOUND',
      messageKey: 'helper.error.notFound'
    })
    expect(err.messageKey).toBe('helper.error.notFound')
  })

  test('cause is attached when provided', () => {
    const original = new Error('original')
    const err = new AppError({ cause: original, code: 'WRAPPED' })
    expect((err as unknown as { cause: unknown }).cause).toBe(original)
  })

  test('cause is not set when omitted', () => {
    const err = new AppError({ code: 'NO_CAUSE' })
    expect((err as unknown as { cause: unknown }).cause).toBeUndefined()
  })

  test('is instanceof AppError', () => {
    const err = new AppError({ code: 'TEST' })
    expect(err).toBeInstanceOf(AppError)
  })

  test('is instanceof Error (prototype chain fix)', () => {
    const err = new AppError({ code: 'TEST' })
    expect(err).toBeInstanceOf(Error)
  })

  test('can be caught as a generic Error', () => {
    expect(() => {
      throw new AppError({ code: 'THROWN' })
    }).toThrow(Error)
  })

  test('can be caught and narrowed by instanceof AppError', () => {
    try {
      throw new AppError({
        code: 'CAUGHT',
        messageKey: 'helper.error.generic'
      })
    } catch (e) {
      expect(e).toBeInstanceOf(AppError)
      if (e instanceof AppError) {
        expect(e.code).toBe('CAUGHT')
        expect(e.messageKey).toBe('helper.error.generic')
      }
    }
  })

  test('accepts arbitrary string codes', () => {
    const err = new AppError({ code: 'FORBIDDEN' })
    expect(err.code).toBe('FORBIDDEN')
  })
})
