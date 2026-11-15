import { beforeEach, describe, expect, test, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mock next/headers cookies and the typed server factory so we can assert the
// adapter wires the cookie store into the auth-aware client.
// ---------------------------------------------------------------------------

interface IServerClientArg {
  cookies: { getAll: () => unknown; setAll: (next: unknown[]) => void }
  url: string
}

const { mockCookies, mockCreateServerClient, mockGetAll } = vi.hoisted(
  () => ({
    mockCookies: vi.fn(),
    mockCreateServerClient: vi.fn<
      (arg: IServerClientArg) => { tag: string }
    >(() => ({ tag: 'server-client' })),
    mockGetAll: vi.fn(() => [{ name: 'sb', value: 'token' }])
  })
)

vi.mock('next/headers', () => ({
  cookies: mockCookies
}))

vi.mock('@app/supabase/server', () => ({
  createSupabaseServerClient: mockCreateServerClient
}))

import { createServerClient } from '@/lib/supabase/server.adapter'

describe('supabase server client adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCookies.mockResolvedValue({ getAll: mockGetAll, set: vi.fn() })
  })

  test('awaits the cookie store and forwards a getAll passthrough', async () => {
    await createServerClient()

    expect(mockCreateServerClient).toHaveBeenCalledWith(
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function)
        }),
        url: expect.any(String)
      })
    )

    // The getAll passthrough reads from the awaited cookie store.
    const [firstCall] = mockCreateServerClient.mock.calls
    firstCall?.[0]?.cookies.getAll()
    expect(mockGetAll).toHaveBeenCalled()
  })

  test('returns a fresh client instance per call', async () => {
    const a = await createServerClient()
    const b = await createServerClient()
    expect(a).toEqual({ tag: 'server-client' })
    expect(b).toEqual({ tag: 'server-client' })
    expect(mockCreateServerClient).toHaveBeenCalledTimes(2)
  })
})
