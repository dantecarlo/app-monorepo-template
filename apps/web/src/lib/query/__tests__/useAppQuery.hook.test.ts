import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { act, renderHook, waitFor } from '@/test/test.helper'

// ---------------------------------------------------------------------------
// Mock the toast store, so a test sees any toast useAppQuery would queue: a
// failed query shows on its screen's ErrorState, never as a toast.
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

// Resolves after every timer already scheduled with no delay has run.
const flushPendingTimers = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve)
  })

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

  test('queues no toast when the query fails, however many components observe it', async () => {
    const options = {
      queryOptions: {
        queryFn: async (): Promise<number> => {
          throw new Error('network down')
        },
        queryKey: ['boom']
      }
    }
    const { result } = renderHook(
      () => ({
        first: useAppQuery<number>(options),
        second: useAppQuery<number>(options)
      }),
      { wrapper: makeWrapper() }
    )

    await waitFor(() => expect(result.current.first.isError).toBe(true))
    expect(result.current.second.isError).toBe(true)
    await act(flushPendingTimers)

    expect(mockAddToast).not.toHaveBeenCalled()
  })
})
