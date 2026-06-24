import { describe, expect, test } from 'vitest'

import { SegmentedControl } from '@/components/ui/SegmentedControl/SegmentedControl.component'

describe('SegmentedControl', () => {
  test('is exported as a function', () => {
    expect(typeof SegmentedControl).toBe('function')
  })
})
