import {
  SERVICE_ERROR_MESSAGE_KEY_BY_CODE,
  ServiceErrorCodeEnum
} from '@app/core'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { SignInFailureEnum } from '@/lib/auth/authGateway.constant'
import { SUPABASE_UNREACHABLE_ERROR_NAME } from '@/lib/supabase/authGateway.constant'

const {
  mockCreateSupabaseAuthGateway,
  mockCreateSupabaseClient,
  mockGetSession,
  mockGetSupabaseClient,
  mockSignIn
} = vi.hoisted(() => {
  const getSession = vi.fn()
  const signIn = vi.fn()
  return {
    mockCreateSupabaseAuthGateway: vi.fn<
      (params: { client: unknown }) => object
    >(() => ({
      getSession,
      onAuthStateChange: vi.fn(),
      signIn,
      signOut: vi.fn()
    })),
    mockCreateSupabaseClient: vi.fn(() => ({ tag: 'created-client' })),
    mockGetSession: getSession,
    mockGetSupabaseClient: vi.fn((): unknown => ({ tag: 'client' })),
    mockSignIn: signIn
  }
})

vi.mock('@app/supabase', () => ({
  createSupabaseAuthGateway: mockCreateSupabaseAuthGateway,
  createSupabaseClient: mockCreateSupabaseClient
}))

vi.mock('@/lib/supabase/client.adapter', () => ({
  getSupabaseClient: mockGetSupabaseClient
}))

const ENV = {
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  NEXT_PUBLIC_SUPABASE_URL: 'https://demo.supabase.co'
}

const CREDENTIALS = { email: 'user@example.com', password: 'secret-pass' }

const BAD_REQUEST_STATUS = 400

const TOO_MANY_REQUESTS_STATUS = 429

// The class name supabase-js gives an error the auth server answered with.
const SUPABASE_API_ERROR_NAME = 'AuthApiError'

interface ISupabaseAuthErrorParams {
  code?: string
  message: string
  name: string
  status: number
}

// An error of the shape supabase-js rejects a sign-in with: its class name,
// the HTTP status and, from the auth server, the error code.
const supabaseAuthError = ({
  code,
  message,
  name,
  status
}: ISupabaseAuthErrorParams): Error =>
  Object.assign(new Error(message), { code, name, status })

const loadAdapter = async () =>
  import('@/lib/supabase/authGateway.adapter')

// The AppError class of the module registry the adapter was loaded into:
// each test resets the modules, so the adapter's @app/core is a fresh one.
const loadAppError = async () => (await import('@app/core')).AppError

const withSupabaseSettings = (): void => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = ENV.NEXT_PUBLIC_SUPABASE_URL
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
    ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

const signInRejection = async (): Promise<unknown> => {
  const { getAuthGateway } = await loadAdapter()
  return getAuthGateway()
    .signIn(CREDENTIALS)
    .catch((error: unknown) => error)
}

describe('auth gateway adapter', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })

  test('returns a no-op gateway without the Supabase settings', async () => {
    const { getAuthGateway } = await loadAdapter()
    const gateway = getAuthGateway()

    await expect(gateway.getSession()).resolves.toBeNull()
    await expect(gateway.signIn(CREDENTIALS)).rejects.toThrow(Error)
    expect(mockCreateSupabaseAuthGateway).not.toHaveBeenCalled()
    expect(mockGetSupabaseClient).not.toHaveBeenCalled()
  })

  test('rejects a sign-in with the not-configured failure without the Supabase settings', async () => {
    const rejection = await signInRejection()

    expect(rejection).toBeInstanceOf(await loadAppError())
    expect(rejection).toMatchObject({
      code: SignInFailureEnum.NOT_CONFIGURED,
      messageKey: 'auth.error.notConfigured'
    })
  })

  test('creates one Supabase auth gateway per browser with the settings', async () => {
    withSupabaseSettings()
    mockGetSession.mockResolvedValue(null)
    const { getAuthGateway } = await loadAdapter()

    const first = getAuthGateway()
    const second = getAuthGateway()

    expect(second).toBe(first)
    expect(mockCreateSupabaseAuthGateway).toHaveBeenCalledOnce()
    expect(mockCreateSupabaseAuthGateway).toHaveBeenCalledWith({
      client: { tag: 'client' }
    })
    await expect(first.getSession()).resolves.toBeNull()
    expect(mockGetSession).toHaveBeenCalledOnce()
  })

  test('hands the gateway the very client the browser client adapter creates', async () => {
    withSupabaseSettings()
    const { getSupabaseClient } = await vi.importActual<
      typeof import('@/lib/supabase/client.adapter')
    >('@/lib/supabase/client.adapter')
    mockGetSupabaseClient.mockImplementationOnce(getSupabaseClient)
    const { getAuthGateway } = await loadAdapter()

    getAuthGateway()

    const created: unknown =
      mockCreateSupabaseClient.mock.results[0]?.value
    expect(mockCreateSupabaseClient).toHaveBeenCalledOnce()
    expect(mockCreateSupabaseAuthGateway).toHaveBeenCalledOnce()
    expect(mockCreateSupabaseAuthGateway.mock.calls[0]?.[0].client).toBe(
      created
    )
    expect(getSupabaseClient()).toBe(created)
  })

  test('names the failure of each Supabase Auth code a sign-in rejects with', async () => {
    withSupabaseSettings()
    const cases = [
      {
        cause: supabaseAuthError({
          code: 'invalid_credentials',
          message: 'Invalid login credentials',
          name: SUPABASE_API_ERROR_NAME,
          status: BAD_REQUEST_STATUS
        }),
        failure: SignInFailureEnum.INVALID_CREDENTIALS,
        messageKey: 'auth.error.invalidCredentials'
      },
      {
        cause: supabaseAuthError({
          code: 'email_not_confirmed',
          message: 'Email not confirmed',
          name: SUPABASE_API_ERROR_NAME,
          status: BAD_REQUEST_STATUS
        }),
        failure: SignInFailureEnum.EMAIL_NOT_CONFIRMED,
        messageKey: 'auth.error.emailNotConfirmed'
      },
      {
        cause: supabaseAuthError({
          code: 'over_request_rate_limit',
          message: 'Request rate limit reached',
          name: SUPABASE_API_ERROR_NAME,
          status: TOO_MANY_REQUESTS_STATUS
        }),
        failure: SignInFailureEnum.RATE_LIMITED,
        messageKey: 'auth.error.rateLimited'
      }
    ]

    for (const { cause, failure, messageKey } of cases) {
      mockSignIn.mockRejectedValueOnce(cause)

      const rejection = await signInRejection()

      expect(rejection).toBeInstanceOf(await loadAppError())
      expect(rejection).toMatchObject({ cause, code: failure, messageKey })
    }
    expect(mockSignIn).toHaveBeenCalledTimes(cases.length)
    expect(mockSignIn).toHaveBeenCalledWith(CREDENTIALS)
  })

  test('names a network failure when Supabase cannot be reached', async () => {
    withSupabaseSettings()
    const cause = supabaseAuthError({
      message: 'Failed to fetch',
      name: SUPABASE_UNREACHABLE_ERROR_NAME,
      status: 0
    })
    mockSignIn.mockRejectedValueOnce(cause)

    const rejection = await signInRejection()

    expect(rejection).toBeInstanceOf(await loadAppError())
    expect(rejection).toMatchObject({
      cause,
      code: ServiceErrorCodeEnum.NETWORK_ERROR,
      messageKey:
        SERVICE_ERROR_MESSAGE_KEY_BY_CODE[
          ServiceErrorCodeEnum.NETWORK_ERROR
        ]
    })
  })

  test('passes any other sign-in rejection through', async () => {
    withSupabaseSettings()
    const banned = supabaseAuthError({
      code: 'user_banned',
      message: 'User is banned',
      name: SUPABASE_API_ERROR_NAME,
      status: BAD_REQUEST_STATUS
    })
    const plain = new Error('Unexpected')
    mockSignIn.mockRejectedValueOnce(banned).mockRejectedValueOnce(plain)

    expect(await signInRejection()).toBe(banned)
    expect(await signInRejection()).toBe(plain)
  })
})
