import { describe, expect, test } from 'vitest'

import { Toggle } from '@/components/ui/Toggle/Toggle.component'

describe('Toggle', () => {
  test('is exported as a function', () => {
    expect(typeof Toggle).toBe('function')
  })
})
