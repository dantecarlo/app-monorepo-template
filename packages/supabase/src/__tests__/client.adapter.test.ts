import {
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  test,
  vi
} from 'vitest'

// The SDK's factory, recorded, so the test reads what the package asks of it
// and what it hands back.
const { mockCreateClient, sdkClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  sdkClient: { auth: {} }
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient
}))

import { fromBackendClient } from '@/backendClient.adapter'
import type { BackendClientType } from '@/backendClient.type'
import { createSupabaseClient } from '@/client.adapter'

const PROJECT = {
  anonKey: 'public-anon-key',
  url: 'https://project.supabase.co'
}

describe('createSupabaseClient', () => {
  beforeEach(() => {
    mockCreateClient.mockReturnValue(sdkClient)
  })

  test('creates the client for the URL and anon key it is handed', () => {
    const client = createSupabaseClient(PROJECT)

    expect(mockCreateClient).toHaveBeenCalledOnce()
    expect(mockCreateClient).toHaveBeenCalledWith(
      PROJECT.url,
      PROJECT.anonKey
    )
    expect(fromBackendClient({ client })).toBe(sdkClient)
  })

  test('returns the opaque backend client', () => {
    expectTypeOf(
      createSupabaseClient
    ).returns.toEqualTypeOf<BackendClientType>()
  })
})
