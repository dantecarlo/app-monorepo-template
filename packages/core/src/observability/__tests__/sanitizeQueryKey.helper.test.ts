import { describe, expect, test } from 'vitest'

import {
  REDACTED_SEGMENT,
  sanitizeQueryKey
} from '@/observability/sanitizeQueryKey.helper'

const STRUCTURAL_SEGMENTS: ReadonlySet<string> = new Set([
  'items',
  'list',
  'page',
  'users'
])

describe('sanitizeQueryKey', () => {
  test('keeps the segments the caller registers', () => {
    const result = sanitizeQueryKey({
      queryKey: ['items', 'list'],
      structuralSegments: STRUCTURAL_SEGMENTS
    })
    expect(result).toEqual(['items', 'list'])
  })

  test('redacts a letters-only segment the caller did not register', () => {
    const result = sanitizeQueryKey({
      queryKey: ['items', 'list', 'alice', 'itemDetail'],
      structuralSegments: STRUCTURAL_SEGMENTS
    })
    expect(result).toEqual([
      'items',
      'list',
      REDACTED_SEGMENT,
      REDACTED_SEGMENT
    ])
  })

  test('redacts a uuid-like dynamic segment', () => {
    const result = sanitizeQueryKey({
      queryKey: ['items', '8f3c1a2b-0000-4444-8888-abcdefabcdef', 'list'],
      structuralSegments: STRUCTURAL_SEGMENTS
    })
    expect(result).toEqual(['items', REDACTED_SEGMENT, 'list'])
  })

  test('redacts segments containing digits', () => {
    const result = sanitizeQueryKey({
      queryKey: ['users', 'abc123'],
      structuralSegments: STRUCTURAL_SEGMENTS
    })
    expect(result).toEqual(['users', REDACTED_SEGMENT])
  })

  test('redacts object filter segments', () => {
    const result = sanitizeQueryKey({
      queryKey: ['users', { role: 'admin' }],
      structuralSegments: STRUCTURAL_SEGMENTS
    })
    expect(result).toEqual(['users', REDACTED_SEGMENT])
  })

  test('redacts numeric segments', () => {
    const ZERO = 0
    const result = sanitizeQueryKey({
      queryKey: ['page', ZERO],
      structuralSegments: STRUCTURAL_SEGMENTS
    })
    expect(result).toEqual(['page', REDACTED_SEGMENT])
  })

  test('returns a single redacted segment for a non-array key', () => {
    expect(
      sanitizeQueryKey({
        queryKey: 'items',
        structuralSegments: STRUCTURAL_SEGMENTS
      })
    ).toEqual([REDACTED_SEGMENT])
  })

  test('handles an empty key', () => {
    expect(
      sanitizeQueryKey({
        queryKey: [],
        structuralSegments: STRUCTURAL_SEGMENTS
      })
    ).toEqual([])
  })
})
