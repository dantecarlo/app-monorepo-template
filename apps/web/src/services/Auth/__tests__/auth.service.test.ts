import { AppError, type IAuthSession } from '@app/core'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const { mockSignIn } = vi.hoisted(() => ({ mockSignIn: vi.fn() }))

vi.mock('@/lib/supabase/authGateway.adapter', () => ({
  getAuthGateway: () => ({ signIn: mockSignIn })
}))

import { signInWithPassword } from '@/services/Auth/auth.service'

const CREDENTIALS = { email: 'user@example.com', password: 'secret-pass' }

const SESSION: IAuthSession = {
  accessToken: 'access-token',
  expiresAt: null,
  userId: 'usr_1'
}

describe('signInWithPassword', () => {
  beforeEach(() => {
    mockSignIn.mockReset()
  })

  test('resolves the session the gateway returns', async () => {
    mockSignIn.mockResolvedValue(SESSION)

    await expect(signInWithPassword(CREDENTIALS)).resolves.toEqual(SESSION)
    expect(mockSignIn).toHaveBeenCalledOnce()
    expect(mockSignIn).toHaveBeenCalledWith(CREDENTIALS)
  })

  test('rejects with an AppError carrying a message key when the gateway rejects', async () => {
    const cause = new Error('Invalid login credentials')
    mockSignIn.mockRejectedValue(cause)

    const rejection = await signInWithPassword(CREDENTIALS).catch(
      (error: unknown) => error
    )

    expect(rejection).toBeInstanceOf(AppError)
    expect((rejection as AppError).messageKey).toBe('helper.error.generic')
    expect((rejection as AppError & { cause: unknown }).cause).toBe(cause)
  })
})
