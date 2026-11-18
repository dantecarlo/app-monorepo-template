import { describe, expect, test } from 'vitest'

import { omitUndefined } from '@/lib/query/omitUndefined.helper'

describe('omitUndefined', () => {
  test('drops every undefined entry and keeps every other, false and 0 included', () => {
    expect(
      omitUndefined({
        enabled: false,
        networkMode: undefined,
        retry: 0,
        staleTime: undefined
      })
    ).toEqual({ enabled: false, retry: 0 })
  })

  test('returns an empty object when every entry is undefined', () => {
    expect(omitUndefined({ gcTime: undefined })).toEqual({})
  })
})
