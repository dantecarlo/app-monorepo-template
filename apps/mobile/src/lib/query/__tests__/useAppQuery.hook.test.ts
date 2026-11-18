import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { createQueryClient } from '@/lib/query/createQueryClient.helper'
import {
  createQueryWrapper,
  createTestQueryClient
} from '@/test/query.helper'
import { act, renderHook, waitFor } from '@/test/test.helper'

// The toast store is mocked so a test sees any toast useAppQuery would add:
// a failed query shows on its screen's ErrorState, never as a toast.
const { mockAddToast } = vi.hoisted(() => ({ mockAddToast: vi.fn() }))

vi.mock('@/stores/toast.store', () => ({
  useToastStore: (
    selector: (s: { add: typeof mockAddToast }) => unknown
  ) => selector({ add: mockAddToast })
}))

import { useAppQuery } from '@/lib/query/useAppQuery.hook'

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

  test('adds no toast when the query fails, however many components observe it', async () => {
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

  test("returns only the fields of the app's own query result", async () => {
    const { result } = renderHook(
      () =>
        useAppQuery<number>({
          queryOptions: {
            queryFn: async () => 42,
            queryKey: ['fields']
          }
        }),
      { wrapper: makeWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(Object.keys(result.current).sort()).toEqual([
      'data',
      'error',
      'isError',
      'isLoading',
      'isSuccess',
      'refetch'
    ])
    expect(result.current).toEqual({
      data: 42,
      error: null,
      isError: false,
      isLoading: false,
      isSuccess: true,
      refetch: expect.any(Function)
    })
  })
})

// The options a query hook forwards to the query, each seen through what it
// changes: whether the queryFn runs, how often, what a new key shows first,
// and what the cached query holds.
const FRESH_FOR_MS = 60_000

describe('useAppQuery options', () => {
  test('never runs the queryFn while enabled is false', async () => {
    const queryFn = vi.fn(async () => 1)
    const { result } = renderHook(
      () =>
        useAppQuery<number>({
          queryOptions: { enabled: false, queryFn, queryKey: ['held'] }
        }),
      { wrapper: createQueryWrapper() }
    )

    await act(flushPendingTimers)

    expect(queryFn).not.toHaveBeenCalled()
    expect(result.current.data).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
  })

  test('retries a failed queryFn as many times as retry says', async () => {
    // No delay between attempts, so the retry lands inside one waitFor.
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, retryDelay: 0 } }
    })
    const queryFn = vi
      .fn<() => Promise<number>>()
      .mockRejectedValueOnce(new Error('first attempt'))
      .mockResolvedValueOnce(2)
    const { result } = renderHook(
      () =>
        useAppQuery<number>({
          queryOptions: { queryFn, queryKey: ['retried'], retry: 1 }
        }),
      { wrapper: createQueryWrapper({ client }) }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(2)
    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  test("keeps the previous key's data while the next key loads, with keepPreviousData", async () => {
    const { rerender, result } = renderHook(
      ({ page }: { page: number }) =>
        useAppQuery<string>({
          queryOptions: {
            keepPreviousData: true,
            queryFn:
              page === 1
                ? async () => 'page one'
                : () => new Promise(() => {}),
            queryKey: ['pages', { page }]
          }
        }),
      { initialProps: { page: 1 }, wrapper: createQueryWrapper() }
    )
    await waitFor(() => expect(result.current.data).toBe('page one'))

    rerender({ page: 2 })

    expect(result.current.data).toBe('page one')
    expect(result.current.isLoading).toBe(false)
  })

  test('hands staleTime and networkMode to the query', async () => {
    const client = createTestQueryClient()
    const { result } = renderHook(
      () =>
        useAppQuery<number>({
          queryOptions: {
            networkMode: 'always',
            queryFn: async () => 3,
            queryKey: ['fresh'],
            staleTime: FRESH_FOR_MS
          }
        }),
      { wrapper: createQueryWrapper({ client }) }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const query = client.getQueryCache().find({ queryKey: ['fresh'] })

    expect(query?.options).toEqual(
      expect.objectContaining({
        networkMode: 'always',
        staleTime: FRESH_FOR_MS
      })
    )
    expect(query?.isStale()).toBe(false)
  })

  test("keeps the client's defaults for every option it leaves out", async () => {
    const client = createQueryClient()
    const { result } = renderHook(
      () =>
        useAppQuery<number>({
          queryOptions: { queryFn: async () => 4, queryKey: ['defaults'] }
        }),
      { wrapper: createQueryWrapper({ client }) }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const query = client.getQueryCache().find({ queryKey: ['defaults'] })

    expect(query?.options).toEqual(
      expect.objectContaining(client.getDefaultOptions().queries)
    )
  })

  test('keeps the same result object across a rerender while its fields are unchanged', async () => {
    const { rerender, result } = renderHook(
      () =>
        useAppQuery<number>({
          queryOptions: { queryFn: async () => 5, queryKey: ['stable'] }
        }),
      { wrapper: createQueryWrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const first = result.current

    rerender()

    expect(result.current).toBe(first)
  })
})
