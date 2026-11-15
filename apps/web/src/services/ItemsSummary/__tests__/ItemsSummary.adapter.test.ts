import { describe, expect, test } from 'vitest'

import type { IItemDto } from '@/screens/ItemsDashboard/models/Item.type'
import { adaptItemsSummary } from '@/services/ItemsSummary/ItemsSummary.adapter'

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
  title: 'Sample item',
  updated_at: '2026-06-22T10:30:00.000Z',
  ...overrides
})

// ---------------------------------------------------------------------------
// adaptItemsSummary
// ---------------------------------------------------------------------------

describe('adaptItemsSummary', () => {
  test('returns zeros for an empty list', () => {
    const vm = adaptItemsSummary([])
    expect(vm.totalCount).toBe(0)
    expect(vm.activeCount).toBe(0)
    expect(vm.archivedCount).toBe(0)
    expect(vm.draftCount).toBe(0)
  })

  test('counts active items correctly', () => {
    const dtos: IItemDto[] = [
      makeDto({ id: 'a', status: 'active' }),
      makeDto({ id: 'b', status: 'active' }),
      makeDto({ id: 'c', status: 'archived' })
    ]
    const vm = adaptItemsSummary(dtos)
    expect(vm.activeCount).toBe(2)
    expect(vm.archivedCount).toBe(1)
    expect(vm.draftCount).toBe(0)
    expect(vm.totalCount).toBe(3)
  })

  test('counts draft items correctly', () => {
    const dtos: IItemDto[] = [
      makeDto({ id: 'a', status: 'draft' }),
      makeDto({ id: 'b', status: 'draft' }),
      makeDto({ id: 'c', status: 'active' })
    ]
    const vm = adaptItemsSummary(dtos)
    expect(vm.draftCount).toBe(2)
    expect(vm.activeCount).toBe(1)
  })

  test('totalCount matches input length', () => {
    const dtos = [
      makeDto({ id: 'a', status: 'active' }),
      makeDto({ id: 'b', status: 'archived' }),
      makeDto({ id: 'c', status: 'draft' })
    ]
    expect(adaptItemsSummary(dtos).totalCount).toBe(3)
  })
})
