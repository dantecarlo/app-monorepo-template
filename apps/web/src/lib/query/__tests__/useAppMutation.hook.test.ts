import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { act, renderHook, waitFor } from '@/test/test.helper'

const { mockAddToast } = vi.hoisted(() => ({ mockAddToast: vi.fn() }))

vi.mock('@/stores/toast.store', () => ({
  useToastStore: (
    selector: (s: { add: typeof mockAddToast }) => unknown
  ) => selector({ add: mockAddToast })
}))

vi.mock('@/lib/i18n/useAppTranslator.hook', () => ({
  useAppTranslator: () => ({
    has: () => false,
    locale: 'en',
    t: (key: string) => key
  })
}))

import { useAppMutation } from '@/lib/query/useAppMutation.hook'

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

  test("returns only the fields of the app's own mutation result", async () => {
    const { result } = renderHook(
      () =>
        useAppMutation<string, void>({
          mutationOptions: { mutationFn: async () => 'ok' }
        }),
      { wrapper: makeWrapper() }
    )

    act(() => result.current.mutate())

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(Object.keys(result.current).sort()).toEqual([
      'data',
      'error',
      'isError',
      'isPending',
      'isSuccess',
      'mutate',
      'reset'
    ])
    expect(result.current).toEqual({
      data: 'ok',
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      mutate: expect.any(Function),
      reset: expect.any(Function)
    })
  })

  test("hands the caller's callbacks one object with the outcome and the variables", async () => {
    const onError = vi.fn()
    const onSuccess = vi.fn()
    const failure = new Error('boom')
    const { result } = renderHook(
      () =>
        useAppMutation<string, { fail: boolean }>({
          mutationOptions: {
            mutationFn: async ({ fail }) => {
              if (fail) throw failure
              return 'ok'
            },
            onError,
            onSuccess
          }
        }),
      { wrapper: makeWrapper() }
    )

    act(() => result.current.mutate({ fail: false }))
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
    act(() => result.current.mutate({ fail: true }))
    await waitFor(() => expect(onError).toHaveBeenCalledOnce())

    expect(onSuccess).toHaveBeenCalledWith({
      data: 'ok',
      variables: { fail: false }
    })
    expect(onError).toHaveBeenCalledWith({
      error: failure,
      variables: { fail: true }
    })
  })
})
