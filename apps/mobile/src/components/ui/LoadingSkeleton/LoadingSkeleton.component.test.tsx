import { describe, expect, test } from 'vitest'

import { ROUNDED_BY_VARIANT } from '@/components/ui/LoadingSkeleton/LoadingSkeleton.styles'

describe('LoadingSkeleton', () => {
  test('ROUNDED_BY_VARIANT covers all preset keys', () => {
    expect(Object.keys(ROUNDED_BY_VARIANT)).toEqual(
      expect.arrayContaining(['sm', 'md', 'lg', 'full'])
    )
  })
})
