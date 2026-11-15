import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() })
}))

vi.mock('@/components/ThemeProvider/useTheme.hook', () => ({
  useTheme: () => ({ setTheme: vi.fn(), theme: 'dark' })
}))

vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    <img alt={alt} src={src} />
  )
}))

import { LoginScreen } from '@/screens/Login/Login.screen'
import { fireEvent, render, screen } from '@/test/test.helper'

const messages = {
  app: { name: 'Acme' },
  auth: {
    languageSwitcher: { label: 'Change language' },
    login: {
      cta: 'Sign in',
      dividerOr: 'or',
      emailLabel: 'Email',
      emailPlaceholder: 'you@example.com',
      errors: {
        email: 'Enter a valid email',
        password: 'Password is too short'
      },
      googleCta: 'Continue with Google',
      googleLoading: 'Connecting…',
      hidePassword: 'Hide password',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Your password',
      showPassword: 'Show password',
      submitting: 'Signing in…',
      subtitle: 'Sign in to continue',
      title: 'Welcome back'
    },
    logo: { label: '{name} logo' },
    themeToggle: { label: 'Toggle theme' }
  }
}

const renderLogin = () =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <LoginScreen />
    </NextIntlClientProvider>
  )

describe('LoginScreen', () => {
  test('renders the brand name, title, and field labels', () => {
    renderLogin()

    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  test('mounts the theme and language controls', () => {
    renderLogin()

    expect(screen.getByRole('switch')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Change language' })
    ).toBeInTheDocument()
  })

  test('surfaces validation errors when submitting empty fields', () => {
    renderLogin()

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(screen.getByText('Enter a valid email')).toBeInTheDocument()
    expect(screen.getByText('Password is too short')).toBeInTheDocument()
  })
})
