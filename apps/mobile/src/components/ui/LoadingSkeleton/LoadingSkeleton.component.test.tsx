import { describe, expect, test } from 'vitest'

import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton/LoadingSkeleton.component'

describe('LoadingSkeleton', () => {
  test('is exported as a function', () => {
    expect(typeof LoadingSkeleton).toBe('function')
  })
})
