import { describe, expect, test } from 'vitest'

import { Icon } from '@/components/ui/Icon/Icon.component'

describe('Icon', () => {
  test('is exported as a function', () => {
    expect(typeof Icon).toBe('function')
  })
})
