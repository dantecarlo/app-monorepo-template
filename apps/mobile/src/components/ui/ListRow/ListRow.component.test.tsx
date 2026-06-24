import { describe, expect, test } from 'vitest'

import { ListRow } from '@/components/ui/ListRow/ListRow.component'

describe('ListRow', () => {
  test('is exported as a function', () => {
    expect(typeof ListRow).toBe('function')
  })
})
