import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const { mockCreateSupabaseClient } = vi.hoisted(() => ({
  mockCreateSupabaseClient: vi.fn(() => ({ tag: 'client' }))
}))

vi.mock('@app/supabase', () => ({
  createSupabaseClient: mockCreateSupabaseClient
}))

const ENV = {
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  NEXT_PUBLIC_SUPABASE_URL: 'https://demo.supabase.co'
}

describe('supabase browser client adapter', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = ENV.NEXT_PUBLIC_SUPABASE_URL
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })

  test('creates the client lazily with the public env credentials', async () => {
    const { getSupabaseClient } =
      await import('@/lib/supabase/client.adapter')
    getSupabaseClient()
    expect(mockCreateSupabaseClient).toHaveBeenCalledWith({
      anonKey: ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      url: ENV.NEXT_PUBLIC_SUPABASE_URL
    })
  })

  test('returns the same instance on subsequent calls', async () => {
    const { getSupabaseClient } =
      await import('@/lib/supabase/client.adapter')
    const a = getSupabaseClient()
    const b = getSupabaseClient()
    expect(a).toBe(b)
    expect(mockCreateSupabaseClient).toHaveBeenCalledTimes(1)
  })

  test('throws a helpful error when env is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const { getSupabaseClient } =
      await import('@/lib/supabase/client.adapter')
    expect(() => getSupabaseClient()).toThrow(
      /Missing NEXT_PUBLIC_SUPABASE/
    )
  })
})
