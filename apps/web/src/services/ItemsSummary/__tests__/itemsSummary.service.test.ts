import { beforeEach, describe, expect, test, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mock the cache policy — applyCachePolicy reaches Next's cache, which runs
// only inside a 'use cache' function of a Next render. The spy records the
// policy the service sets; CacheLifeEnum stays the real one.
// ---------------------------------------------------------------------------
const { applyCachePolicy } = vi.hoisted(() => ({
  applyCachePolicy: vi.fn()
}))

vi.mock('@/lib/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/cache')>()),
  applyCachePolicy
}))

// ---------------------------------------------------------------------------
// Mock the Items service — the summary service wraps getItems; we control the
// return value here rather than depending on the mock delay in the real impl.
// ---------------------------------------------------------------------------
vi.mock('@/services/Items/items.service', () => ({
  getItems: vi.fn().mockResolvedValue([
    {
      author_id: 'usr_1',
      author_name: 'Alice Brown',
      category: 'UX',
      created_at: '2026-06-22T10:00:00.000Z',
      description: 'Streamline onboarding.',
      id: 'item_001',
      status: 'active',
      title: 'Improve onboarding flow',
      updated_at: '2026-06-22T10:30:00.000Z'
    },
    {
      author_id: 'usr_2',
      author_name: 'Bob Carter',
      category: 'Frontend',
      created_at: '2026-06-22T08:00:00.000Z',
      description: 'Dark mode support.',
      id: 'item_002',
      status: 'archived',
      title: 'Add dark mode',
      updated_at: '2026-06-22T09:00:00.000Z'
    },
    {
      author_id: null,
      author_name: null,
      category: 'Docs',
      created_at: '2026-06-21T10:00:00.000Z',
      description: 'Write API docs.',
      id: 'item_003',
      status: 'draft',
      title: 'Write API documentation',
      updated_at: '2026-06-21T10:00:00.000Z'
    }
  ])
}))

import { CacheLifeEnum } from '@/lib/cache'
import { CACHE_TAG } from '@/services/ItemsSummary/itemsSummary.constant'
import { getItemsSummary } from '@/services/ItemsSummary/itemsSummary.service'

describe('getItemsSummary', () => {
  beforeEach(() => {
    applyCachePolicy.mockClear()
  })

  test('returns summary counts that reflect the mocked item list', async () => {
    const vm = await getItemsSummary()
    expect(vm.totalCount).toBe(3)
    expect(vm.activeCount).toBe(1)
    expect(vm.archivedCount).toBe(1)
    expect(vm.draftCount).toBe(1)
  })

  test('sets the minutes life profile and the items-summary tag once', async () => {
    await getItemsSummary()

    expect(applyCachePolicy).toHaveBeenCalledExactlyOnceWith({
      life: CacheLifeEnum.MINUTES,
      tags: [CACHE_TAG]
    })
    expect(CACHE_TAG).toBe('items-summary')
  })
})
