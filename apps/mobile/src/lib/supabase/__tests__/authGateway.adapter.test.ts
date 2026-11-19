import { describe, expect, test, vi } from 'vitest'

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

describe('mobile auth gateway adapter', () => {
  test('builds the auth gateway over the client the client adapter creates', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
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
})
