import { describe, expect, test } from 'vitest'

import { createNoopAuthGateway } from '@/lib/auth/noopAuthGateway.helper'

const CREDENTIALS = { email: 'user@example.com', password: 'secret-pass' }

describe('noop auth gateway', () => {
  test('has no session and rejects a sign-in', async () => {
    const gateway = createNoopAuthGateway()

    await expect(gateway.getSession()).resolves.toBeNull()
    await expect(gateway.signIn(CREDENTIALS)).rejects.toThrow(Error)
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
})
