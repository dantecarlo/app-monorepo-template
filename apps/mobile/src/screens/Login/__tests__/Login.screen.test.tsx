import { describe, expect, test, vi } from 'vitest'

import { render, screen } from '@/test/test.helper'

vi.mock('@/lib/i18n/useAppTranslator.hook', () => ({
  useAppTranslator: () => ({
    has: () => false,
    locale: 'en',
    t: (key: string) => key
  })
}))

vi.mock('@/components/ui/AuthShell/AuthShell.component', () => ({
  AuthShell: ({ children }: { children?: unknown }) => children
}))

vi.mock('@/components/ui/AuthField/AuthField.component', () => ({
  AuthField: () => null
}))

vi.mock('@/components/ui/Button/Button.component', () => ({
  Button: () => null
}))

vi.mock('@/screens/Login/hooks/useLoginForm.hook', () => ({
  useLoginForm: () => ({
    errors: {},
    isSubmitting: false,
    onEmailChange: () => undefined,
    onPasswordChange: () => undefined,
    onSubmit: () => undefined,
    values: { email: '', password: '' }
  })
}))

import { LoginScreen } from '@/screens/Login/Login.screen'

describe('LoginScreen (mobile)', () => {
  test('renders without returning null', () => {
    const result = LoginScreen()
    expect(result).not.toBeNull()
  })

  test('renders no social sign-in button', () => {
    render(<LoginScreen />)

    expect(screen.queryByText('auth.login.googleCta')).toBeNull()
    expect(screen.queryByText('auth.login.dividerOr')).toBeNull()
  })
})
