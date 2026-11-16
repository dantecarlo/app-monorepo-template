import type { IAuthSession } from '@app/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { act, renderHook, waitFor } from '@/test/test.helper'

const { mockAddToast, mockReplace, mockSignIn } = vi.hoisted(() => ({
  mockAddToast: vi.fn(),
  mockReplace: vi.fn(),
  mockSignIn: vi.fn()
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace })
}))

vi.mock('next-intl', () => ({
  useTranslations: () =>
    Object.assign((key: string) => key, { has: () => true })
}))

vi.mock('@/stores/toast.store', () => ({
  useToastStore: (
    selector: (s: { add: typeof mockAddToast }) => unknown
  ) => selector({ add: mockAddToast })
}))

vi.mock('@/lib/supabase/authGateway.adapter', () => ({
  getAuthGateway: () => ({ signIn: mockSignIn })
}))

import { useSignIn } from '@/screens/Login/hooks/useSignIn.hook'

const CREDENTIALS = { email: 'user@example.com', password: 'secret-pass' }

const SESSION: IAuthSession = {
  accessToken: 'access-token',
  expiresAt: null,
  userId: 'usr_1'
}

const makeWrapper = () => {
  const queryClient = new QueryClient()
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    )
  return Wrapper
}

describe('useSignIn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('replaces the route with the home page and keeps no token', async () => {
    mockSignIn.mockResolvedValue(SESSION)
    const { result } = renderHook(() => useSignIn(), {
      wrapper: makeWrapper()
    })

    act(() => result.current.mutate(CREDENTIALS))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ userId: 'usr_1' })
    expect(mockReplace).toHaveBeenCalledOnce()
    expect(mockReplace).toHaveBeenCalledWith('/')
  })

  test('queues the toast of the error message key and stays on the route', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid login credentials'))
    const { result } = renderHook(() => useSignIn(), {
      wrapper: makeWrapper()
    })

    act(() => result.current.mutate(CREDENTIALS))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockAddToast).toHaveBeenCalledOnce()
    expect(mockAddToast).toHaveBeenCalledWith({
      message: 'helper.error.generic',
      variant: 'error'
    })
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
