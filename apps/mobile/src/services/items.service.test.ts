import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { getItem, getItems } from '@/services/items.service'

// The mobile service is a mock backed by an in-memory list with a simulated
// network delay. Fake timers keep these tests instant and deterministic.

describe('items.service (mock backend)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('getItems resolves the full list when no search is given', async () => {
    const promise = getItems({})
    await vi.runAllTimersAsync()
    const items = await promise
    expect(items.length).toBeGreaterThan(0)
    expect(items[0]?.id).toBe('item_001')
  })

  test('getItems filters by a case-insensitive search term', async () => {
    const promise = getItems({ search: 'DARK' })
    await vi.runAllTimersAsync()
    const items = await promise
    expect(items).toHaveLength(1)
    expect(items[0]?.title).toMatch(/dark mode/i)
  })

  test('getItems respects the limit', async () => {
    const promise = getItems({ limit: 2 })
    await vi.runAllTimersAsync()
    const items = await promise
    expect(items).toHaveLength(2)
  })

  test('getItem returns the matching item by id', async () => {
    const promise = getItem({ itemId: 'item_002' })
    await vi.runAllTimersAsync()
    const item = await promise
    expect(item?.id).toBe('item_002')
  })

  test('getItem returns null for an unknown id (null-guard)', async () => {
    const promise = getItem({ itemId: 'does-not-exist' })
    await vi.runAllTimersAsync()
    const item = await promise
    expect(item).toBeNull()
  })
})
