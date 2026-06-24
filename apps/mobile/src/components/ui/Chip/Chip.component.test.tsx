import { describe, expect, test } from 'vitest'

import { Chip } from '@/components/ui/Chip/Chip.component'

describe('Chip', () => {
  test('is exported as a function', () => {
    expect(typeof Chip).toBe('function')
  })
})
