import { describe, expect, test } from 'vitest'

import { StatusBadge } from '@/components/ui/StatusBadge/StatusBadge.component'

describe('StatusBadge', () => {
  test('is exported as a function', () => {
    expect(typeof StatusBadge).toBe('function')
  })
})
