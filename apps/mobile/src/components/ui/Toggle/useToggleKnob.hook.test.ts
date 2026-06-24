import { describe, expect, test } from 'vitest'

import { useToggleKnob } from '@/components/ui/Toggle/useToggleKnob.hook'

describe('useToggleKnob', () => {
  test('is exported as a function', () => {
    expect(typeof useToggleKnob).toBe('function')
  })
})
