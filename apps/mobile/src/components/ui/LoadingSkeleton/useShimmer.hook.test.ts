import { describe, expect, test } from 'vitest'

import {
  SHIMMER_DURATION,
  SHIMMER_TRANSLATE_RANGE
} from '@/components/ui/LoadingSkeleton/LoadingSkeleton.styles'

describe('useShimmer constants', () => {
  test('SHIMMER_DURATION is a positive number', () => {
    expect(SHIMMER_DURATION).toBeGreaterThan(0)
  })

  test('SHIMMER_TRANSLATE_RANGE is a positive number', () => {
    expect(SHIMMER_TRANSLATE_RANGE).toBeGreaterThan(0)
  })
})
