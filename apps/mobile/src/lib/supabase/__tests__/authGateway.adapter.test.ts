import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

// The package's factories, recorded: the client the app's client adapter
// creates, and the gateway built over it.
const {
  gateway,
  mockCreateSupabaseAuthGateway,
  mockCreateSupabaseClient
} = vi.hoisted(() => {
  const builtGateway = {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn()
  }
  return {
    gateway: builtGateway,
    mockCreateSupabaseAuthGateway: vi.fn<
      (params: { client: unknown }) => typeof builtGateway
    >(() => builtGateway),
    mockCreateSupabaseClient: vi.fn(() => ({ tag: 'client' }))
  }
})

vi.mock('@app/supabase', () => ({
  createSupabaseAuthGateway: mockCreateSupabaseAuthGateway,
  createSupabaseClient: mockCreateSupabaseClient
}))

const CREDENTIALS = { email: 'user@example.com', password: 'secret-pass' }

const withSupabaseSettings = (): void => {
  vi.stubEnv('EXPO_PUBLIC_SUPABASE_URL', 'https://demo.supabase.co')
  vi.stubEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')
}

const withoutSupabaseSettings = (): void => {
  vi.stubEnv('EXPO_PUBLIC_SUPABASE_URL', undefined)
  vi.stubEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', undefined)
}

describe('mobile auth gateway adapter', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test('builds the auth gateway over the client the client adapter creates', async () => {
    withSupabaseSettings()
    const { supabase } = await import('@/lib/supabase/client.adapter')
    const { authGateway } =
      await import('@/lib/supabase/authGateway.adapter')

    expect(mockCreateSupabaseClient).toHaveBeenCalledOnce()
    expect(mockCreateSupabaseAuthGateway).toHaveBeenCalledOnce()
    expect(mockCreateSupabaseAuthGateway.mock.calls[0]?.[0].client).toBe(
      supabase
    )
    expect(supabase).toBe(mockCreateSupabaseClient.mock.results[0]?.value)
    expect(authGateway).toBe(gateway)
  })

  test('names the Supabase settings in the rejection of a sign-in without them', async () => {
    withoutSupabaseSettings()
    const { authGateway } =
      await import('@/lib/supabase/authGateway.adapter')

    const rejection = await authGateway
      .signIn(CREDENTIALS)
      .catch((error: unknown) => error)

    expect(mockCreateSupabaseAuthGateway).not.toHaveBeenCalled()
    expect(rejection).toBeInstanceOf(Error)
    expect((rejection as Error).message).toContain(
      'EXPO_PUBLIC_SUPABASE_URL'
    )
    expect((rejection as Error).message).toContain(
      'EXPO_PUBLIC_SUPABASE_ANON_KEY'
    )
  })
})
