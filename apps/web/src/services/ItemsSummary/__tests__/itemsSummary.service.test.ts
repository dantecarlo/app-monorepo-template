import { describe, expect, test, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mock next/cache — cacheLife and cacheTag are Next.js runtime APIs that
// require server request context. In unit tests we stub them out so the
// service logic can be exercised in isolation (Vitest / Node environment).
// ---------------------------------------------------------------------------
vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn()
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

import { getItemsSummary } from '@/services/ItemsSummary/itemsSummary.service'

describe('getItemsSummary', () => {
  test('returns summary counts that reflect the mocked item list', async () => {
    const vm = await getItemsSummary()
    expect(vm.totalCount).toBe(3)
    expect(vm.activeCount).toBe(1)
    expect(vm.archivedCount).toBe(1)
    expect(vm.draftCount).toBe(1)
  })
})
