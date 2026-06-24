import type { IAuthGateway, IAuthSession } from '@app/core'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/stores/auth.store'

import { useAuthBootstrap } from './useAuthBootstrap.hook'

const mockSession: IAuthSession = {
  accessToken: 'tok',
  expiresAt: null,
  userId: 'u1'
}

const makeGateway = (
  sessionOverride: IAuthSession | null = mockSession
): IAuthGateway => ({
  getSession: vi.fn().mockResolvedValue(sessionOverride),
  onAuthStateChange: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  signIn: vi.fn(),
  signOut: vi.fn()
})

beforeEach(() => {
  useAuthStore.setState({ session: null, status: 'loading' })
})

describe('useAuthBootstrap', () => {
  it('sets status to authenticated after getSession resolves with a session', async () => {
    const gateway = makeGateway(mockSession)
    const { unmount } = renderHook(() => useAuthBootstrap({ gateway }))

    await vi.waitFor(() =>
      expect(useAuthStore.getState().status).toBe('authenticated')
    )
    expect(useAuthStore.getState().session).toEqual(mockSession)
    unmount()
  })

  it('sets status to unauthenticated when getSession resolves with null', async () => {
    const gateway = makeGateway(null)
    const { unmount } = renderHook(() => useAuthBootstrap({ gateway }))

    await vi.waitFor(() =>
      expect(useAuthStore.getState().status).toBe('unauthenticated')
    )
    unmount()
  })

  it('calls unsubscribe on unmount', () => {
    const unsubscribe = vi.fn()
    const gateway = makeGateway()
    ;(
      gateway.onAuthStateChange as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      unsubscribe
    })
    const { unmount } = renderHook(() => useAuthBootstrap({ gateway }))
    unmount()
    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  it('subscribes to auth state changes', () => {
    const gateway = makeGateway()
    const { unmount } = renderHook(() => useAuthBootstrap({ gateway }))
    expect(gateway.onAuthStateChange).toHaveBeenCalledOnce()
    unmount()
  })
})
