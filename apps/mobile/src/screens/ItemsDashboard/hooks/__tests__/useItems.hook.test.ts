import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { IItemDto } from '@/screens/ItemsDashboard/models/Item.type'
import { act, renderHook, waitFor } from '@/test/test.helper'

// The hook's queryFn calls the in-memory getItems directly, so that function
// is mocked; adaptItems stays real.
const { mockGetItems } = vi.hoisted(() => ({ mockGetItems: vi.fn() }))

vi.mock('@/services/Items', async (importActual) => {
  const actual = await importActual<typeof import('@/services/Items')>()
  return { ...actual, getItems: mockGetItems }
})

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
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

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    )
  return Wrapper
}

describe('useItems', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('reports the failure and runs the query again on retry', async () => {
    mockGetItems.mockRejectedValueOnce(new Error('items down'))
    mockGetItems.mockResolvedValueOnce([ITEM_DTO])

    const { result } = renderHook(() => useItems(), {
      wrapper: makeWrapper()
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
