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
  authGateway: mockBackendGateway
}))
// endregion supabase
import { authGateway } from '@/lib/auth/authGateway.adapter'

const PORT_METHODS: (keyof IAuthGateway)[] = [
  'getSession',
  'onAuthStateChange',
  'signIn',
  'signOut'
]

describe('auth gateway adapter', () => {
  test('serves a gateway with every method of the auth gateway port', () => {
    expect(
      PORT_METHODS.map((method) => typeof authGateway[method])
    ).toEqual(PORT_METHODS.map(() => 'function'))
    expect(
      typeof authGateway.onAuthStateChange({ onChange: vi.fn() })
        .unsubscribe
    ).toBe('function')
  })
  // region supabase
  test('serves the gateway the supabase capability builds', () => {
    expect(authGateway).toBe(mockBackendGateway)
  })
  // endregion supabase
})
