import type { IAuthGateway } from '@app/core'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/stores/auth.store'

import { AuthProvider } from './AuthProvider.component'

const makeGateway = (): IAuthGateway => ({
  getSession: vi.fn().mockResolvedValue(null),
  onAuthStateChange: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  signIn: vi.fn(),
  signOut: vi.fn()
})

describe('AuthProvider', () => {
  it('renders children', () => {
    useAuthStore.setState({ session: null, status: 'loading' })
    const gateway = makeGateway()
    const { getByText } = render(
      <AuthProvider gateway={gateway}>
        <span>child</span>
      </AuthProvider>
    )
    expect(getByText('child')).toBeDefined()
  })

  it('calls getSession on mount', async () => {
    const gateway = makeGateway()
    const { unmount } = render(
      <AuthProvider gateway={gateway}>
        <div />
      </AuthProvider>
    )
    await vi.waitFor(() =>
      expect(gateway.getSession).toHaveBeenCalledOnce()
    )
    unmount()
  })
})
