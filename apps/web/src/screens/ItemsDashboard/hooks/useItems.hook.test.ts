import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { MOCK_ITEM_DTOS } from '@/test/mocks/items.mock'
import { act, renderHook, waitFor } from '@/test/test.helper'

// ---------------------------------------------------------------------------
// Hoisted mock refs.
//
// The hook's queryFn calls the in-memory getItems collaborator directly, so we
// mock that module (not HTTP — MSW would not intercept an in-memory function).
// We mock only getItems; adaptItems is kept real so adapter logic runs.
// ---------------------------------------------------------------------------

const { mockGetItems } = vi.hoisted(() => ({
  mockGetItems: vi.fn()
}))

vi.mock('@/services/Items', async (importActual) => {
  const actual = await importActual<typeof import('@/services/Items')>()
  return {
    ...actual,
    getItems: mockGetItems
  }
})

// ---------------------------------------------------------------------------
// Module under test (imported after the mock is registered).
// ---------------------------------------------------------------------------

import { useItems } from '@/screens/ItemsDashboard/hooks/useItems.hook'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useItems', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('exposes adapted view models and derived counts on success', async () => {
    mockGetItems.mockResolvedValueOnce(MOCK_ITEM_DTOS)

    const { result } = renderHook(() => useItems(), {
      wrapper: makeWrapper()
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.items).toHaveLength(MOCK_ITEM_DTOS.length)
    expect(result.current.totalCount).toBe(MOCK_ITEM_DTOS.length)
    // Only one of the fixtures has status 'active'.
    expect(result.current.activeCount).toBe(1)
    // The adapter ran — view models expose derived initials.
    expect(result.current.items[0]?.authorInitials).toBe('AB')
  })

  test('is in loading state initially', () => {
    mockGetItems.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useItems(), {
      wrapper: makeWrapper()
    })

    expect(result.current.isLoading).toBe(true)
  })

  test('forwards search and limit to the service when search changes', async () => {
    mockGetItems.mockResolvedValue(MOCK_ITEM_DTOS)

    const { result } = renderHook(() => useItems({ limit: 10 }), {
      wrapper: makeWrapper()
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.onSearchChange('onboarding'))

    await waitFor(() =>
      expect(mockGetItems).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, search: 'onboarding' })
      )
    )
  })
})
