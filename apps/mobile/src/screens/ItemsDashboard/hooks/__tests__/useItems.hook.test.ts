import { describe, expect, test } from 'vitest'

import { useItems } from '@/screens/ItemsDashboard/hooks/useItems.hook'

describe('useItems', () => {
  test('is exported as a function', () => {
    expect(typeof useItems).toBe('function')
  })
})
