import type { IAuthGateway } from '@app/core'
import { describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/stores/auth.store'

import { AuthProvider } from './AuthProvider.component'

const makeGateway = (): IAuthGateway => ({
  getSession: vi.fn().mockResolvedValue(null),
  onAuthStateChange: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  signIn: vi.fn(),
  signOut: vi.fn()
})

describe('AuthProvider (mobile)', () => {
  it('calls getSession on mount via bootstrap', async () => {
    useAuthStore.setState({ session: null, status: 'loading' })
    const gateway = makeGateway()
    AuthProvider({ children: null, gateway })
    await vi.waitFor(() =>
      expect(gateway.getSession).toHaveBeenCalledOnce()
    )
  })
})
