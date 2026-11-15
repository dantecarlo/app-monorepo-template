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

describe('mobile supabase client adapter', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    vi.restoreAllMocks()
  })

  test('creates the client with env credentials when present', async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co'
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'

    await import('@/lib/supabase/client.adapter')

    expect(mockCreateSupabaseClient).toHaveBeenCalledWith({
      anonKey: 'anon-key',
      url: 'https://demo.supabase.co'
    })
    expect(console.warn).not.toHaveBeenCalled()
  })

  test('falls back to placeholders and warns when env is absent', async () => {
    await import('@/lib/supabase/client.adapter')

    expect(mockCreateSupabaseClient).toHaveBeenCalledWith({
      anonKey: 'public-anon-placeholder',
      url: 'https://placeholder.supabase.co'
    })
    expect(console.warn).toHaveBeenCalledTimes(1)
  })
})
