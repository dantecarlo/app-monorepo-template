import { beforeEach, describe, expect, test, vi } from 'vitest'

import { QueryKeys } from '@/lib/query/queryKeys.constant'
import type { IItemDto } from '@/screens/ItemsDashboard/models/Item.type'
import {
  createQueryWrapper,
  createTestQueryClient
} from '@/test/query.helper'
import { act, renderHook, waitFor } from '@/test/test.helper'

// The hook's queryFn calls the in-memory getItems directly, so that function
// is mocked; adaptItems stays real.
const { mockGetItems } = vi.hoisted(() => ({ mockGetItems: vi.fn() }))

vi.mock('@/services/Items', async (importActual) => {
  const actual = await importActual<typeof import('@/services/Items')>()
  return { ...actual, getItems: mockGetItems }
})

vi.mock('@/lib/i18n/useAppTranslator.hook', () => ({
  useAppTranslator: () => ({
    has: () => false,
    locale: 'en',
    t: (key: string) => key
  })
}))

import { useItems } from '@/screens/ItemsDashboard/hooks/useItems.hook'

const ITEM_DTO: IItemDto = {
  author_id: 'usr_1',
  author_name: 'Alice Brown',
  category: 'UX',
  created_at: '2026-01-01T00:00:00.000Z',
  description: 'Streamline the first-run experience.',
  id: 'item_001',
  status: 'active',
  title: 'Improve onboarding flow',
  updated_at: '2026-01-01T00:00:00.000Z'
}

describe('useItems', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('keeps one cache entry per limit, each with its own items', async () => {
    const dtos = [ITEM_DTO, { ...ITEM_DTO, id: 'item_002' }]
    mockGetItems.mockImplementation(async ({ limit }: { limit: number }) =>
      dtos.slice(0, limit)
    )
    const queryClient = createTestQueryClient()

    const { result } = renderHook(
      () => ({ one: useItems({ limit: 1 }), two: useItems({ limit: 2 }) }),
      { wrapper: createQueryWrapper({ client: queryClient }) }
    )

    await waitFor(() => {
      expect(result.current.one.isLoading).toBe(false)
      expect(result.current.two.isLoading).toBe(false)
    })

    expect(result.current.one.items).toHaveLength(1)
    expect(result.current.two.items).toHaveLength(2)
    expect(mockGetItems).toHaveBeenCalledTimes(2)
    expect(mockGetItems).toHaveBeenCalledWith({ limit: 1, search: '' })
    expect(mockGetItems).toHaveBeenCalledWith({ limit: 2, search: '' })
    const keys = queryClient
      .getQueryCache()
      .findAll({ queryKey: QueryKeys.items.all })
      .map(({ queryKey }) => queryKey)
    expect(keys).toHaveLength(2)
    expect(keys).toEqual(
      expect.arrayContaining([
        QueryKeys.items.list({ limit: 1, search: '' }),
        QueryKeys.items.list({ limit: 2, search: '' })
      ])
    )
  })

  test('reports the failure and runs the query again on retry', async () => {
    mockGetItems.mockRejectedValueOnce(new Error('items down'))
    mockGetItems.mockResolvedValueOnce([ITEM_DTO])

    const { result } = renderHook(() => useItems(), {
      wrapper: createQueryWrapper()
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.items).toEqual([])
    expect(mockGetItems).toHaveBeenCalledOnce()

    act(() => result.current.onRetry())

    await waitFor(() => expect(result.current.isError).toBe(false))
    expect(mockGetItems).toHaveBeenCalledTimes(2)
    expect(result.current.items).toHaveLength(1)
  })
})
