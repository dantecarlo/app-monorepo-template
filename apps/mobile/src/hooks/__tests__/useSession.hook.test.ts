import type { IAuthSession } from '@app/core'
import { beforeEach, describe, expect, test } from 'vitest'

import { useSession } from '@/hooks/useSession.hook'
import {
  selectAuthStatus,
  selectSession,
  useAuthStore
} from '@/stores/auth.store'
import { act, renderHook } from '@/test/test.helper'

const mockSession: IAuthSession = {
  accessToken: 'tok',
  expiresAt: null,
  userId: 'u1'
}

beforeEach(() => {
  useAuthStore.setState({ session: null, status: 'loading' })
})

describe('useSession (mobile)', () => {
  test('returns loading status and null session initially', () => {
    const state = useAuthStore.getState()
    expect(selectAuthStatus(state)).toBe('loading')
    expect(selectSession(state)).toBeNull()
  })

  test('reflects updates from the auth store', () => {
    useAuthStore.getState().setSession(mockSession)
    useAuthStore.getState().setStatus('authenticated')
    const state = useAuthStore.getState()
    expect(selectSession(state)).toEqual(mockSession)
    expect(selectAuthStatus(state)).toBe('authenticated')
  })

  test('returns the same object across renders while the session is unchanged', () => {
    const { rerender, result } = renderHook(() => useSession())
    const first = result.current

    rerender()

    expect(result.current).toBe(first)
    expect(result.current).toEqual({ session: null, status: 'loading' })
  })

  test('returns a new object holding the new session after a change', () => {
    const { result } = renderHook(() => useSession())
    const first = result.current

    act(() => {
      useAuthStore.getState().setSession(mockSession)
      useAuthStore.getState().setStatus('authenticated')
    })

    expect(result.current).not.toBe(first)
    expect(result.current).toEqual({
      session: mockSession,
      status: 'authenticated'
    })
  })
})
