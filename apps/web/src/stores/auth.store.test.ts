import type { IAuthSession } from '@app/core'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  selectAuthStatus,
  selectSession,
  useAuthStore,
  useSession
} from './auth.store'

const mockSession: IAuthSession = {
  accessToken: 'token-abc',
  expiresAt: null,
  userId: 'user-1'
}

beforeEach(() => {
  useAuthStore.setState({
    session: null,
    status: 'loading'
  })
})

describe('auth.store', () => {
  it('starts in loading status with no session', () => {
    const state = useAuthStore.getState()
    expect(state.status).toBe('loading')
    expect(state.session).toBeNull()
  })

  it('setSession updates the session slice', () => {
    useAuthStore.getState().setSession(mockSession)
    expect(selectSession(useAuthStore.getState())).toEqual(mockSession)
  })

  it('setStatus transitions to authenticated', () => {
    useAuthStore.getState().setStatus('authenticated')
    expect(selectAuthStatus(useAuthStore.getState())).toBe('authenticated')
  })

  it('reset clears session and sets unauthenticated', () => {
    useAuthStore.getState().setSession(mockSession)
    useAuthStore.getState().setStatus('authenticated')
    useAuthStore.getState().reset()
    expect(selectSession(useAuthStore.getState())).toBeNull()
    expect(selectAuthStatus(useAuthStore.getState())).toBe(
      'unauthenticated'
    )
  })

  it('useSession selector returns session and status together', () => {
    useAuthStore.getState().setSession(mockSession)
    useAuthStore.getState().setStatus('authenticated')
    const result = useSession()
    expect(result.session).toEqual(mockSession)
    expect(result.status).toBe('authenticated')
  })
})
