import type { IAuthGateway, IAuthSession } from '@app/core'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { useAuthStore } from '@/stores/auth.store'

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
  test('hydrates store with session from gateway', async () => {
    const gateway = makeGateway(mockSession)
    const { setSession, setStatus } = useAuthStore.getState()

    setStatus('loading')
    const session = await gateway.getSession()
    setSession(session)
    setStatus(session ? 'authenticated' : 'unauthenticated')

    expect(useAuthStore.getState().status).toBe('authenticated')
    expect(useAuthStore.getState().session).toEqual(mockSession)
  })

  test('sets unauthenticated when session is null', async () => {
    const gateway = makeGateway(null)
    const { setSession, setStatus } = useAuthStore.getState()

    setStatus('loading')
    const session = await gateway.getSession()
    setSession(session)
    setStatus(session ? 'authenticated' : 'unauthenticated')

    expect(useAuthStore.getState().status).toBe('unauthenticated')
    expect(useAuthStore.getState().session).toBeNull()
  })

  test('subscribes to auth state changes on mount', () => {
    const gateway = makeGateway()
    gateway.onAuthStateChange({
      onChange: ({ session }) => {
        useAuthStore.getState().setSession(session)
        useAuthStore
          .getState()
          .setStatus(session ? 'authenticated' : 'unauthenticated')
      }
    })
    expect(gateway.onAuthStateChange).toHaveBeenCalledOnce()
  })
})
