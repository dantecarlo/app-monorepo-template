import { ServiceErrorCodeEnum } from '@app/core'
import { describe, expect, test } from 'vitest'

import { mapSupabaseError } from '@/mapSupabaseError.adapter'

const HTTP_FORBIDDEN = 403
const HTTP_NOT_FOUND = 404
const HTTP_SERVER_ERROR = 500
const HTTP_BAD_GATEWAY = 502
const HTTP_BAD_REQUEST = 400

interface IPostgrestLike {
  code: string
  details: string | null
  hint: string | null
  message: string
  status?: number
}

const makePostgrestError = (
  overrides: Partial<IPostgrestLike> = {}
): IPostgrestLike => ({
  code: 'PGRST000',
  details: null,
  hint: null,
  message: 'postgrest failure',
  ...overrides
})

describe('mapSupabaseError', () => {
  test('maps a 403 Postgrest error to FORBIDDEN', () => {
    expect(
      mapSupabaseError.mapError({
        error: makePostgrestError({ status: HTTP_FORBIDDEN })
      })
    ).toBe(ServiceErrorCodeEnum.FORBIDDEN)
  })

  test('maps a 404 Postgrest error to NOT_FOUND', () => {
    expect(
      mapSupabaseError.mapError({
        error: makePostgrestError({ status: HTTP_NOT_FOUND })
      })
    ).toBe(ServiceErrorCodeEnum.NOT_FOUND)
  })

  test('maps a 500 Postgrest error to SERVER_ERROR', () => {
    expect(
      mapSupabaseError.mapError({
        error: makePostgrestError({ status: HTTP_SERVER_ERROR })
      })
    ).toBe(ServiceErrorCodeEnum.SERVER_ERROR)
  })

  test('maps any 5xx Postgrest error to SERVER_ERROR', () => {
    expect(
      mapSupabaseError.mapError({
        error: makePostgrestError({ status: HTTP_BAD_GATEWAY })
      })
    ).toBe(ServiceErrorCodeEnum.SERVER_ERROR)
  })

  test('maps an unrecognised 4xx Postgrest error to UNKNOWN', () => {
    expect(
      mapSupabaseError.mapError({
        error: makePostgrestError({ status: HTTP_BAD_REQUEST })
      })
    ).toBe(ServiceErrorCodeEnum.UNKNOWN)
  })

  test('maps a Postgrest error without a status to UNKNOWN', () => {
    expect(
      mapSupabaseError.mapError({ error: makePostgrestError() })
    ).toBe(ServiceErrorCodeEnum.UNKNOWN)
  })

  test('returns null for a plain Error', () => {
    expect(
      mapSupabaseError.mapError({ error: new Error('plain') })
    ).toBeNull()
  })

  test('returns null for a string', () => {
    expect(mapSupabaseError.mapError({ error: 'boom' })).toBeNull()
  })

  test('returns null for null', () => {
    expect(mapSupabaseError.mapError({ error: null })).toBeNull()
  })
})
