import { describe, expect, test } from 'vitest'

import { Avatar } from '@/components/ui/Avatar/Avatar.component'

describe('Avatar', () => {
  test('is exported as a function', () => {
    expect(typeof Avatar).toBe('function')
  })
})
