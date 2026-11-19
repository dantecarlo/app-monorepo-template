import {
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  test,
  vi
} from 'vitest'

// The SSR SDK's factory, recorded, so the test reads what the package asks
// of it and what it hands back.
const { mockCreateServerClient, sdkClient } = vi.hoisted(() => ({
  mockCreateServerClient: vi.fn(),
  sdkClient: { auth: {} }
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: mockCreateServerClient
}))

import { fromBackendClient } from '@/backendClient.adapter'
import type { BackendClientType } from '@/backendClient.type'
import { createSupabaseServerClient } from '@/server.adapter'

const PROJECT = {
  anonKey: 'public-anon-key',
  url: 'https://project.supabase.co'
}

const cookies = {
  getAll: () => [{ name: 'sb-session', value: 'token' }],
  setAll: () => undefined
}

describe('createSupabaseServerClient', () => {
  beforeEach(() => {
    mockCreateServerClient.mockReturnValue(sdkClient)
  })

  test('creates the SSR client over the cookie methods it is handed', () => {
    const client = createSupabaseServerClient({ ...PROJECT, cookies })

    expect(mockCreateServerClient).toHaveBeenCalledOnce()
    expect(mockCreateServerClient).toHaveBeenCalledWith(
      PROJECT.url,
      PROJECT.anonKey,
      { cookies }
    )
    expect(mockCreateServerClient.mock.calls[0]?.[2]?.cookies).toBe(
      cookies
    )
    expect(fromBackendClient({ client })).toBe(sdkClient)
  })

  test('returns the opaque backend client', () => {
    expectTypeOf(
      createSupabaseServerClient
    ).returns.toEqualTypeOf<BackendClientType>()
  })
})
