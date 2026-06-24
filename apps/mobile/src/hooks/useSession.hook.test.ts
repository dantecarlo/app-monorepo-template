import type { IAuthSession } from '@app/core'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  selectAuthStatus,
  selectSession,
  useAuthStore
} from '@/stores/auth.store'

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
    const state = useAuthStore.getState()
    expect(selectAuthStatus(state)).toBe('loading')
    expect(selectSession(state)).toBeNull()
  })

  it('reflects updates from the auth store', () => {
    useAuthStore.getState().setSession(mockSession)
    useAuthStore.getState().setStatus('authenticated')
    const state = useAuthStore.getState()
    expect(selectSession(state)).toEqual(mockSession)
    expect(selectAuthStatus(state)).toBe('authenticated')
  })
})
