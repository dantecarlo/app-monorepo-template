import { describe, expect, test } from 'vitest'

import { EmptyState } from '@/components/ui/EmptyState/EmptyState.component'

describe('EmptyState', () => {
  test('is exported as a function', () => {
    expect(typeof EmptyState).toBe('function')
  })
})
