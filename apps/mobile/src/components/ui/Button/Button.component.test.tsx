import { describe, expect, test } from 'vitest'

import { Button } from '@/components/ui/Button/Button.component'

describe('Button', () => {
  test('is exported as a function', () => {
    expect(typeof Button).toBe('function')
  })
})
