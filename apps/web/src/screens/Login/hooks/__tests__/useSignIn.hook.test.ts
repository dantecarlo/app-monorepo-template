import { AppError } from '@app/core'
import { DEFAULT_LANGUAGE, resources } from '@app/i18n'
import React from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { AppI18nProvider } from '@/lib/i18n/AppI18nProvider.component'
import { createQueryClient } from '@/lib/query/createQueryClient.helper'
import { useToastStore } from '@/stores/toast.store'
import { createQueryWrapper } from '@/test/query.helper'
import { act, renderHook, waitFor } from '@/test/test.helper'

// Only the browser Supabase client is replaced: the auth gateway, the auth
// service, the adapter, the mutation, the toast store and the query client
// are the real ones.
const { mockReplace, mockSignInWithPassword } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockSignInWithPassword: vi.fn()
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace })
}))

vi.mock('@/lib/supabase/client.adapter', () => ({
  getSupabaseClient: () => ({
    auth: { signInWithPassword: mockSignInWithPassword }
  })
}))

import { useSignIn } from '@/screens/Login/hooks/useSignIn.hook'

const CREDENTIALS = { email: 'user@example.com', password: 'secret-pass' }

const messages = resources[DEFAULT_LANGUAGE].translation
const GENERIC_MESSAGE = messages.helper.error.generic

const SUPABASE_SESSION = {
  access_token: 'access-token',
  expires_at: 1_900_000_000,
  user: { id: 'usr_1' }
}

const renderSignIn = () => {
  const onCaptureError = vi.fn()
  const queryClient = createQueryClient({ onCaptureError })
  const QueryWrapper = createQueryWrapper({ client: queryClient })
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryWrapper, {
      children: React.createElement(AppI18nProvider, {
        children,
        locale: DEFAULT_LANGUAGE,
        messages
      })
    })
  const view = renderHook(() => useSignIn(), { wrapper: Wrapper })
  return { ...view, onCaptureError, queryClient }
}

const signInAndSettle = async ({
  result
}: Pick<ReturnType<typeof renderSignIn>, 'result'>) => {
  act(() => result.current.mutate(CREDENTIALS))
  await waitFor(() => expect(mockSignInWithPassword).toHaveBeenCalled())
  await waitFor(() => expect(result.current.isPending).toBe(false))
}

describe('useSignIn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://demo.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')
    useToastStore.getState().clear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test('replaces the route with the home page and keeps no token', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: SUPABASE_SESSION },
      error: null
    })
    const { result } = renderSignIn()

    act(() => result.current.mutate(CREDENTIALS))

    await waitFor(() => expect(mockReplace).toHaveBeenCalledOnce())
    expect(mockReplace).toHaveBeenCalledWith('/')
    expect(mockSignInWithPassword).toHaveBeenCalledWith(CREDENTIALS)
    expect(useToastStore.getState().toasts).toEqual([])
  })

  test('queues the generic toast, reports the error once and stays on the route when the sign-in fails', async () => {
    mockSignInWithPassword.mockRejectedValue(
      new Error(
        `Invalid login credentials for ${CREDENTIALS.email} with ${CREDENTIALS.password}`
      )
    )
    const { onCaptureError, result } = renderSignIn()

    await signInAndSettle({ result })

    await waitFor(() =>
      expect(useToastStore.getState().toasts).toHaveLength(1)
    )
    const [toast] = useToastStore.getState().toasts
    expect(toast).toEqual(
      expect.objectContaining({
        message: GENERIC_MESSAGE,
        variant: 'error'
      })
    )
    expect(toast?.message).not.toContain(CREDENTIALS.email)
    expect(toast?.message).not.toContain(CREDENTIALS.password)
    expect(onCaptureError).toHaveBeenCalledOnce()
    const [captured, context] = onCaptureError.mock.calls[0] ?? []
    expect(captured).toBeInstanceOf(AppError)
    expect((captured as AppError).code).toBe('UNKNOWN')
    expect(context).toEqual({ source: 'mutationCache' })
    expect(mockReplace).not.toHaveBeenCalled()
  })

  test('keeps no credentials in the mutation cache after a rejected sign-in', async () => {
    mockSignInWithPassword.mockRejectedValue(new Error('Invalid login'))
    const { queryClient, result } = renderSignIn()

    await signInAndSettle({ result })

    await waitFor(() =>
      expect(
        queryClient
          .getMutationCache()
          .getAll()
          .filter((mutation) =>
            JSON.stringify(mutation.state.variables ?? null).includes(
              CREDENTIALS.password
            )
          )
      ).toEqual([])
    )
  })

  test('queues the generic toast and stays on the route when the gateway returns no session', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null },
      error: null
    })
    const { result } = renderSignIn()

    await signInAndSettle({ result })

    await waitFor(() =>
      expect(useToastStore.getState().toasts).toEqual([
        expect.objectContaining({
          message: GENERIC_MESSAGE,
          variant: 'error'
        })
      ])
    )
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
