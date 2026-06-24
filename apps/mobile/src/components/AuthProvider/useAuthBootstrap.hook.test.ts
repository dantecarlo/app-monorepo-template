import type { IAuthGateway, IAuthSession } from '@app/core'
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

describe('useAuthBootstrap (mobile)', () => {
  it('hydrates store with session from gateway', async () => {
    const gateway = makeGateway(mockSession)
    const { setSession, setStatus } = useAuthStore.getState()
    useAuthBootstrap({ gateway })
    await vi.waitFor(() =>
      expect(useAuthStore.getState().status).toBe('authenticated')
    )
    expect(gateway.getSession).toHaveBeenCalledOnce()
    void setSession
    void setStatus
  })

  it('sets unauthenticated when session is null', async () => {
    const gateway = makeGateway(null)
    useAuthBootstrap({ gateway })
    await vi.waitFor(() =>
      expect(useAuthStore.getState().status).toBe('unauthenticated')
    )
  })

  it('subscribes to auth state changes on mount', () => {
    const gateway = makeGateway()
    useAuthBootstrap({ gateway })
    expect(gateway.onAuthStateChange).toHaveBeenCalledOnce()
  })
})
