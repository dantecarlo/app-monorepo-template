import { describe, expect, test, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
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

vi.mock(
  '@/components/ui/SocialAuthButton/SocialAuthButton.component',
  () => ({
    SocialAuthButton: () => null
  })
)

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

import { LoginScreen } from './Login.screen'

describe('LoginScreen (mobile)', () => {
  test('renders without returning null', () => {
    const result = LoginScreen()
    expect(result).not.toBeNull()
  })
})
