import { describe, expect, test } from 'vitest'

import {
  REDACTED_SEGMENT,
  sanitizeQueryKey
} from '@/observability/sanitizeQueryKey.helper'

describe('sanitizeQueryKey', () => {
  test('keeps short lowercase structural segments', () => {
    const result = sanitizeQueryKey({ queryKey: ['items', 'list'] })
    expect(result).toEqual(['items', 'list'])
  })

  test('redacts a uuid-like dynamic segment', () => {
    const result = sanitizeQueryKey({
      queryKey: ['items', '8f3c1a2b-0000-4444-8888-abcdefabcdef', 'list']
    })
    expect(result).toEqual(['items', REDACTED_SEGMENT, 'list'])
  })

  test('redacts segments containing digits', () => {
    const result = sanitizeQueryKey({ queryKey: ['users', 'abc123'] })
    expect(result).toEqual(['users', REDACTED_SEGMENT])
  })

  test('redacts object filter segments', () => {
    const result = sanitizeQueryKey({
      queryKey: ['users', { role: 'admin' }]
    })
    expect(result).toEqual(['users', REDACTED_SEGMENT])
  })

  test('redacts segments that exceed the structural length limit', () => {
    const longToken = 'a'.repeat(40)
    const result = sanitizeQueryKey({ queryKey: ['items', longToken] })
    expect(result).toEqual(['items', REDACTED_SEGMENT])
  })

  test('redacts numeric segments', () => {
    const ZERO = 0
    const result = sanitizeQueryKey({ queryKey: ['page', ZERO] })
    expect(result).toEqual(['page', REDACTED_SEGMENT])
  })

  test('returns a single redacted segment for a non-array key', () => {
    expect(sanitizeQueryKey({ queryKey: 'items' })).toEqual([
      REDACTED_SEGMENT
    ])
  })

  test('handles an empty key', () => {
    expect(sanitizeQueryKey({ queryKey: [] })).toEqual([])
  })
})
