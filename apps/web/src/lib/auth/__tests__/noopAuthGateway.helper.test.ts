import { AppError } from '@app/core'
import { describe, expect, test } from 'vitest'

import { SignInFailureEnum } from '@/lib/auth/authGateway.constant'
import {
  createNoopAuthGateway,
  toSignInFailure
} from '@/lib/auth/noopAuthGateway.helper'

const CREDENTIALS = { email: 'user@example.com', password: 'secret-pass' }

describe('noop auth gateway', () => {
  test('has no session and rejects a sign-in with the not-configured failure', async () => {
    const gateway = createNoopAuthGateway()

    await expect(gateway.getSession()).resolves.toBeNull()
    const rejection = await gateway
      .signIn(CREDENTIALS)
      .catch((error: unknown) => error)
    expect(rejection).toBeInstanceOf(AppError)
    expect(rejection).toMatchObject({
      code: SignInFailureEnum.NOT_CONFIGURED,
      messageKey: 'auth.error.notConfigured'
    })
  })

  test('subscribes no listener and signs out at once', async () => {
    const gateway = createNoopAuthGateway()

    expect(() =>
      gateway
        .onAuthStateChange({ onChange: () => undefined })
        .unsubscribe()
    ).not.toThrow()
    await expect(gateway.signOut()).resolves.toBeUndefined()
  })

  test('makes a sign-in failure an AppError with its message key and its cause', () => {
    const cause = new Error('Too many requests')

    expect(
      toSignInFailure({ cause, failure: SignInFailureEnum.RATE_LIMITED })
    ).toMatchObject({
      cause,
      code: SignInFailureEnum.RATE_LIMITED,
      messageKey: 'auth.error.rateLimited'
    })
  })
})
