import type { IAuthSession } from '@app/core'
import { beforeEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '@/stores/auth.store'

import { useSession } from './useSession.hook'

const mockSession: IAuthSession = {
  accessToken: 'tok',
  expiresAt: null,
  userId: 'u1'
}

beforeEach(() => {
  useAuthStore.setState({ session: null, status: 'loading' })
})

describe('useSession (mobile)', () => {
  it('returns loading status and null session initially', () => {
    const result = useSession()
    expect(result.status).toBe('loading')
    expect(result.session).toBeNull()
  })

  it('reflects updates from the auth store', () => {
    useAuthStore.getState().setSession(mockSession)
    useAuthStore.getState().setStatus('authenticated')
    const result = useSession()
    expect(result.session).toEqual(mockSession)
    expect(result.status).toBe('authenticated')
  })
})
