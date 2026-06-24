import { describe, expect, test } from 'vitest'

import { useShimmer } from '@/components/ui/LoadingSkeleton/useShimmer.hook'

describe('useShimmer', () => {
  test('is exported as a function', () => {
    expect(typeof useShimmer).toBe('function')
  })
})
