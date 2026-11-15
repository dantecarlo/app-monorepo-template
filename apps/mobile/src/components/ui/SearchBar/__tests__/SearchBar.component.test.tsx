import { describe, expect, test } from 'vitest'

import { SearchBar } from '@/components/ui/SearchBar/SearchBar.component'

describe('SearchBar', () => {
  test('is exported as a function', () => {
    expect(typeof SearchBar).toBe('function')
  })
})
