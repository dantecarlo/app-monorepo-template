import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { renderHook, waitFor } from '@/test/test.helper'

// ---------------------------------------------------------------------------
// Mock the toast store — useAppQuery fires an error toast on failure.
// ---------------------------------------------------------------------------

const { mockAddToast } = vi.hoisted(() => ({ mockAddToast: vi.fn() }))

vi.mock('@/stores/toast.store', () => ({
  useToastStore: (
    selector: (s: { add: typeof mockAddToast }) => unknown
  ) => selector({ add: mockAddToast })
}))

import { useAppQuery } from '@/lib/query/useAppQuery.hook'

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

describe('useAppQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns data on success', async () => {
    const { result } = renderHook(
      () =>
        useAppQuery<number>({
          queryOptions: {
            queryFn: async () => 42,
            queryKey: ['answer']
          }
        }),
      { wrapper: makeWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(42)
  })

  test('applies the adapter to the raw result', async () => {
    const { result } = renderHook(
      () =>
        useAppQuery<number>({
          adapter: (raw) => raw * 2,
          queryOptions: {
            queryFn: async () => 21,
            queryKey: ['doubled']
          }
        }),
      { wrapper: makeWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(42)
  })

  test('fires an error toast with the override message on failure', async () => {
    const { result } = renderHook(
      () =>
        useAppQuery<number>({
          errorMessage: 'Could not load',
          queryOptions: {
            queryFn: async () => {
              throw new Error('network down')
            },
            queryKey: ['boom']
          }
        }),
      { wrapper: makeWrapper() }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    await waitFor(() =>
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Could not load',
          variant: 'error'
        })
      )
    )
  })
})
