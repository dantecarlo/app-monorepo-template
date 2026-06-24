import type { IAuthGateway } from '@app/core'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/components/AuthProvider/useAuthBootstrap.hook', () => ({
  useAuthBootstrap: vi.fn()
}))

import { useAuthBootstrap } from '@/components/AuthProvider/useAuthBootstrap.hook'

import { AuthProvider } from './AuthProvider.component'

const makeGateway = (): IAuthGateway => ({
  getSession: vi.fn().mockResolvedValue(null),
  onAuthStateChange: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  signIn: vi.fn(),
  signOut: vi.fn()
})

describe('AuthProvider (mobile)', () => {
  it('calls getSession on mount via bootstrap', () => {
    const gateway = makeGateway()
    AuthProvider({ children: null, gateway })
    expect(useAuthBootstrap).toHaveBeenCalledWith({ gateway })
  })
})
