import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, expectTypeOf, test } from 'vitest'

import {
  fromBackendClient,
  toBackendClient
} from '@/backendClient.adapter'
import type { BackendClientType } from '@/backendClient.type'
import type { Database } from '@/types'

// An SDK client as far as the wrapper reads it: any object, kept by
// reference.
const sdkClient = { auth: {} } as unknown as SupabaseClient<Database>

describe('backend client adapter', () => {
  test('hands back the very client it wrapped', () => {
    const client = toBackendClient({ client: sdkClient })

    expect(fromBackendClient({ client })).toBe(sdkClient)
  })

  test('names no Supabase type in the client it hands out', () => {
    expectTypeOf(
      toBackendClient
    ).returns.toEqualTypeOf<BackendClientType>()
    expectTypeOf<BackendClientType>().not.toMatchTypeOf<
      SupabaseClient<Database>
    >()
    expectTypeOf<
      SupabaseClient<Database>
    >().not.toMatchTypeOf<BackendClientType>()
  })
})
