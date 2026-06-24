import { describe, expect, test } from 'vitest'

import { NavBar } from '@/components/ui/NavBar/NavBar.component'

describe('NavBar', () => {
  test('is exported as a function', () => {
    expect(typeof NavBar).toBe('function')
  })
})
