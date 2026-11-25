import type { IAuthGateway } from '@app/core'
import { describe, expect, test, vi } from 'vitest'

// region supabase
const { mockBackendGateway } = vi.hoisted(() => ({
  mockBackendGateway: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ unsubscribe: vi.fn() })),
    signIn: vi.fn(),
    signOut: vi.fn()
  }
}))

vi.mock('@/lib/supabase/authGateway.adapter', () => ({
  getAuthGateway: () => mockBackendGateway
}))
// endregion supabase
import { getAuthGateway } from '@/lib/auth/authGateway.adapter'

const PORT_METHODS: (keyof IAuthGateway)[] = [
  'getSession',
  'onAuthStateChange',
  'signIn',
  'signOut'
]

describe('auth gateway adapter', () => {
  test('serves a gateway with every method of the auth gateway port', () => {
    const gateway = getAuthGateway()

    expect(PORT_METHODS.map((method) => typeof gateway[method])).toEqual(
      PORT_METHODS.map(() => 'function')
    )
    expect(
      typeof gateway.onAuthStateChange({ onChange: vi.fn() }).unsubscribe
    ).toBe('function')
  })
  // region supabase
  test('serves the gateway the supabase capability builds', () => {
    expect(getAuthGateway()).toBe(mockBackendGateway)
  })
  // endregion supabase
})
