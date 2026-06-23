import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { act, renderHook, waitFor } from '@/test/test.helper'

// ---------------------------------------------------------------------------
// Mock the toast store — useAppMutation fires toasts on success/error.
// ---------------------------------------------------------------------------

const { mockAddToast } = vi.hoisted(() => ({ mockAddToast: vi.fn() }))

vi.mock('@/stores/toast.store', () => ({
  useToastStore: (
    selector: (s: { add: typeof mockAddToast }) => unknown
  ) => selector({ add: mockAddToast })
}))

import { useAppMutation } from '@/lib/query/useAppMutation.hook'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } }
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

describe('useAppMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('shows a success toast when successMessage is provided', async () => {
    const { result } = renderHook(
      () =>
        useAppMutation<string, void>({
          mutationOptions: { mutationFn: async () => 'ok' },
          successMessage: 'Saved!'
        }),
      { wrapper: makeWrapper() }
    )

    act(() => result.current.mutate())

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Saved!', variant: 'success' })
    )
  })

  test('shows an error toast with the override message on failure', async () => {
    const { result } = renderHook(
      () =>
        useAppMutation<string, void>({
          errorMessage: 'Save failed',
          mutationOptions: {
            mutationFn: async () => {
              throw new Error('boom')
            }
          }
        }),
      { wrapper: makeWrapper() }
    )

    act(() => result.current.mutate())

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Save failed', variant: 'error' })
    )
  })

  test('still runs the caller onSuccess callback', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(
      () =>
        useAppMutation<string, void>({
          mutationOptions: { mutationFn: async () => 'ok', onSuccess }
        }),
      { wrapper: makeWrapper() }
    )

    act(() => result.current.mutate())

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })
})
