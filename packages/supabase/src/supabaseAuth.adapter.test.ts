import { describe, expect, test, vi } from 'vitest'

import { createSupabaseAuthGateway } from '@/supabaseAuth.adapter'

const makeSession = (overrides = {}) => ({
  access_token: 'token-abc',
  expires_at: 9999999,
  user: { id: 'user-1' },
  ...overrides
})

const makeSubscription = () => ({
  data: {
    subscription: { unsubscribe: vi.fn() }
  }
})

const makeAuthMock = (sessionOverride?: object | null) => ({
  getSession: vi.fn().mockResolvedValue({
    data: {
      session:
        sessionOverride !== undefined ? sessionOverride : makeSession()
    },
    error: null
  }),
  onAuthStateChange: vi.fn().mockReturnValue(makeSubscription()),
  signInWithPassword: vi.fn().mockResolvedValue({
    data: { session: makeSession() },
    error: null
  }),
  signOut: vi.fn().mockResolvedValue({ error: null })
})

const makeClient = (authMock = makeAuthMock()) =>
  ({ auth: authMock }) as unknown as Parameters<
    typeof createSupabaseAuthGateway
  >[0]

describe('createSupabaseAuthGateway', () => {
  test('getSession returns null when the SDK session is null', async () => {
    const client = makeClient(makeAuthMock(null))
    const gateway = createSupabaseAuthGateway(client)

    expect(await gateway.getSession()).toBeNull()
  })

  test('getSession maps the SDK session to IAuthSession', async () => {
    const client = makeClient()
    const gateway = createSupabaseAuthGateway(client)

    const session = await gateway.getSession()

    expect(session).toEqual({
      accessToken: 'token-abc',
      expiresAt: 9999999,
      userId: 'user-1'
    })
  })

  test('signIn maps the returned session to IAuthSession', async () => {
    const client = makeClient()
    const gateway = createSupabaseAuthGateway(client)

    const session = await gateway.signIn({
      email: 'user@example.com',
      password: 'secret'
    })

    expect(session).toEqual({
      accessToken: 'token-abc',
      expiresAt: 9999999,
      userId: 'user-1'
    })
  })

  test('signIn throws when the SDK returns an error', async () => {
    const authMock = makeAuthMock()
    authMock.signInWithPassword.mockResolvedValueOnce({
      data: { session: null },
      error: new Error('invalid credentials')
    })
    const client = makeClient(authMock)
    const gateway = createSupabaseAuthGateway(client)

    await expect(
      gateway.signIn({ email: 'user@example.com', password: 'wrong' })
    ).rejects.toThrow('invalid credentials')
  })

  test('signOut delegates to the SDK', async () => {
    const authMock = makeAuthMock()
    const client = makeClient(authMock)
    const gateway = createSupabaseAuthGateway(client)

    await gateway.signOut()

    expect(authMock.signOut).toHaveBeenCalledOnce()
  })

  test('onAuthStateChange calls onChange with a mapped session', () => {
    const authMock = makeAuthMock()
    let capturedCallback:
      | ((event: string, session: unknown) => void)
      | null = null
    authMock.onAuthStateChange.mockImplementation(
      (cb: (event: string, session: unknown) => void) => {
        capturedCallback = cb
        return makeSubscription()
      }
    )
    const client = makeClient(authMock)
    const gateway = createSupabaseAuthGateway(client)
    const onChange = vi.fn()

    gateway.onAuthStateChange({ onChange })

    capturedCallback!('SIGNED_IN', makeSession())
    expect(onChange).toHaveBeenCalledWith({
      session: {
        accessToken: 'token-abc',
        expiresAt: 9999999,
        userId: 'user-1'
      }
    })
  })

  test('onAuthStateChange calls onChange with null on sign-out', () => {
    const authMock = makeAuthMock()
    let capturedCallback:
      | ((event: string, session: unknown) => void)
      | null = null
    authMock.onAuthStateChange.mockImplementation(
      (cb: (event: string, session: unknown) => void) => {
        capturedCallback = cb
        return makeSubscription()
      }
    )
    const client = makeClient(authMock)
    const gateway = createSupabaseAuthGateway(client)
    const onChange = vi.fn()

    gateway.onAuthStateChange({ onChange })
    capturedCallback!('SIGNED_OUT', null)

    expect(onChange).toHaveBeenCalledWith({ session: null })
  })

  test('unsubscribe delegates to the SDK subscription', () => {
    const sub = makeSubscription()
    const authMock = makeAuthMock()
    authMock.onAuthStateChange.mockReturnValue(sub)
    const client = makeClient(authMock)
    const gateway = createSupabaseAuthGateway(client)

    const subscription = gateway.onAuthStateChange({ onChange: vi.fn() })
    subscription.unsubscribe()

    expect(sub.data.subscription.unsubscribe).toHaveBeenCalledOnce()
  })
})
