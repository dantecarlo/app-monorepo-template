import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  createQueryWrapper,
  createTestQueryClient
} from '@/test/query.helper'
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

describe('useAppMutation options and result', () => {
  test("runs the caller's onMutate with the variables first, and onSettled with the outcome", async () => {
    const onMutate = vi.fn()
    const onSettled = vi.fn()
    const failure = new Error('boom')
    const mutationFn = vi.fn(async ({ fail }: { fail: boolean }) => {
      if (fail) throw failure
      return 'ok'
    })
    const { result } = renderHook(
      () =>
        useAppMutation<string, { fail: boolean }>({
          mutationOptions: { mutationFn, onMutate, onSettled }
        }),
      { wrapper: createQueryWrapper() }
    )

    act(() => result.current.mutate({ fail: false }))
    await waitFor(() => expect(onSettled).toHaveBeenCalledOnce())
    act(() => result.current.mutate({ fail: true }))
    await waitFor(() => expect(onSettled).toHaveBeenCalledTimes(2))

    expect(onMutate).toHaveBeenNthCalledWith(1, {
      variables: { fail: false }
    })
    expect(onMutate).toHaveBeenNthCalledWith(2, {
      variables: { fail: true }
    })
    expect(onMutate.mock.invocationCallOrder[0]).toBeLessThan(
      mutationFn.mock.invocationCallOrder[0] ?? 0
    )
    expect(onSettled).toHaveBeenNthCalledWith(1, {
      data: 'ok',
      error: null,
      variables: { fail: false }
    })
    expect(onSettled).toHaveBeenNthCalledWith(2, {
      data: undefined,
      error: failure,
      variables: { fail: true }
    })
  })

  test('caches the mutation under its mutationKey', async () => {
    const client = createTestQueryClient()
    const { result } = renderHook(
      () =>
        useAppMutation<string, void>({
          mutationOptions: {
            mutationFn: async () => 'ok',
            mutationKey: ['items', 'save']
          }
        }),
      { wrapper: createQueryWrapper({ client }) }
    )

    act(() => result.current.mutate())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(
      client.getMutationCache().find({ mutationKey: ['items', 'save'] })
    ).toBeDefined()
  })

  test('runs the onSettled of one mutate call once that call settles', async () => {
    const onSettled = vi.fn()
    const { result } = renderHook(
      () =>
        useAppMutation<string, void>({
          mutationOptions: { mutationFn: async () => 'ok' }
        }),
      { wrapper: createQueryWrapper() }
    )

    act(() => result.current.mutate(undefined, { onSettled }))

    await waitFor(() => expect(onSettled).toHaveBeenCalledOnce())
    expect(result.current.isSuccess).toBe(true)
  })

  test('reset clears the outcome of the last run', async () => {
    const { result } = renderHook(
      () =>
        useAppMutation<string, void>({
          mutationOptions: { mutationFn: async () => 'ok' }
        }),
      { wrapper: createQueryWrapper() }
    )
    act(() => result.current.mutate())
    await waitFor(() => expect(result.current.data).toBe('ok'))

    act(() => result.current.reset())

    await waitFor(() => expect(result.current.data).toBeUndefined())
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  test('keeps the same result object across a rerender while its fields are unchanged', () => {
    const { rerender, result } = renderHook(
      () =>
        useAppMutation<string, void>({
          mutationOptions: { mutationFn: async () => 'ok' }
        }),
      { wrapper: createQueryWrapper() }
    )
    const first = result.current

    rerender()

    expect(result.current).toBe(first)
  })
})
