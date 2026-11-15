import { describe, expect, test } from 'vitest'

import type { IItemDto } from '@/screens/ItemsDashboard/models/Item.type'
import { adaptItem, adaptItems } from '@/services/Items/Items.adapter'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeDto = (overrides: Partial<IItemDto> = {}): IItemDto => ({
  author_id: 'usr_1',
  author_name: 'Alice Brown',
  category: 'UX',
  created_at: '2026-06-22T10:00:00.000Z',
  description: 'A sample description.',
  id: 'item_001',
  status: 'active',
  title: 'Improve onboarding flow',
  updated_at: '2026-06-22T10:30:00.000Z',
  ...overrides
})

// ---------------------------------------------------------------------------
// adaptItem — single DTO
// ---------------------------------------------------------------------------

describe('adaptItem', () => {
  test('maps title and description straight through', () => {
    const vm = adaptItem(makeDto())
    expect(vm.title).toBe('Improve onboarding flow')
    expect(vm.description).toBe('A sample description.')
  })

  test('builds initials from a two-word author name', () => {
    expect(
      adaptItem(makeDto({ author_name: 'Alice Brown' })).authorInitials
    ).toBe('AB')
  })

  test('falls back to "?" initials when author_name is null (null-guard)', () => {
    const vm = adaptItem(makeDto({ author_id: null, author_name: null }))
    expect(vm.authorInitials).toBe('?')
    expect(vm.authorLabel).toBe('')
  })

  test('preserves the status', () => {
    expect(adaptItem(makeDto({ status: 'draft' })).status).toBe('draft')
  })
})

// ---------------------------------------------------------------------------
// adaptItems — array
// ---------------------------------------------------------------------------

describe('adaptItems', () => {
  test('returns an empty array for empty input', () => {
    expect(adaptItems([])).toEqual([])
  })

  test('maps all DTOs preserving order', () => {
    const vms = adaptItems([
      makeDto({ id: 'item_001' }),
      makeDto({ id: 'item_002' })
    ])
    expect(vms.map((v) => v.id)).toEqual(['item_001', 'item_002'])
  })
})
