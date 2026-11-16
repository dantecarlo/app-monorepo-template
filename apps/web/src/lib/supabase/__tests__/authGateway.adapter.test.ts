import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const { mockCreateSupabaseAuthGateway, mockGetSupabaseClient } =
  vi.hoisted(() => ({
    mockCreateSupabaseAuthGateway: vi.fn(() => ({
      tag: 'supabase-gateway'
    })),
    mockGetSupabaseClient: vi.fn(() => ({ tag: 'client' }))
  }))

vi.mock('@app/supabase', () => ({
  createSupabaseAuthGateway: mockCreateSupabaseAuthGateway
}))

vi.mock('@/lib/supabase/client.adapter', () => ({
  getSupabaseClient: mockGetSupabaseClient
}))

const ENV = {
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  NEXT_PUBLIC_SUPABASE_URL: 'https://demo.supabase.co'
}

const loadAdapter = async () =>
  import('@/lib/supabase/authGateway.adapter')

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
    await expect(
      gateway.signIn({
        email: 'user@example.com',
        password: 'secret-pass'
      })
    ).rejects.toThrow(Error)
    expect(mockCreateSupabaseAuthGateway).not.toHaveBeenCalled()
    expect(mockGetSupabaseClient).not.toHaveBeenCalled()
  })

  test('creates one Supabase auth gateway per browser with the settings', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ENV.NEXT_PUBLIC_SUPABASE_URL
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const { getAuthGateway } = await loadAdapter()

    const first = getAuthGateway()
    const second = getAuthGateway()

    expect(first).toEqual({ tag: 'supabase-gateway' })
    expect(second).toBe(first)
    expect(mockCreateSupabaseAuthGateway).toHaveBeenCalledOnce()
    expect(mockCreateSupabaseAuthGateway).toHaveBeenCalledWith({
      client: { tag: 'client' }
    })
  })
})
