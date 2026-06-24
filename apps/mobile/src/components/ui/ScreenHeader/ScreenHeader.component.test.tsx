import { describe, expect, test } from 'vitest'

import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader.component'

describe('ScreenHeader', () => {
  test('is exported as a function', () => {
    expect(typeof ScreenHeader).toBe('function')
  })
})
