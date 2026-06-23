import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mock the typed source so we assert on what the wrapper forwards, without
// spinning up a real Supabase client.
// ---------------------------------------------------------------------------

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

  test('creates the client with the public env credentials', async () => {
    await import('@/lib/supabase/client.adapter')
    expect(mockCreateSupabaseClient).toHaveBeenCalledWith({
      anonKey: ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      url: ENV.NEXT_PUBLIC_SUPABASE_URL
    })
  })

  test('throws a helpful error when env is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    await expect(import('@/lib/supabase/client.adapter')).rejects.toThrow(
      /Missing NEXT_PUBLIC_SUPABASE/
    )
  })
})
