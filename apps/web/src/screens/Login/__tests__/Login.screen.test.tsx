import type { IAuthSession } from '@app/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const { mockReplace, mockSignIn } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockSignIn: vi.fn()
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: mockReplace })
}))

vi.mock('@/lib/supabase/authGateway.adapter', () => ({
  getAuthGateway: () => ({ signIn: mockSignIn })
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
import { useToastStore } from '@/stores/toast.store'
import { fireEvent, render, screen, waitFor } from '@/test/test.helper'

const CREDENTIALS = { email: 'user@example.com', password: 'secret-pass' }

const SESSION: IAuthSession = {
  accessToken: 'access-token',
  expiresAt: null,
  userId: 'usr_1'
}

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
  },
  helper: {
    error: { generic: 'Something went wrong. Please try again.' }
  }
}

const renderLogin = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <LoginScreen />
      </NextIntlClientProvider>
    </QueryClientProvider>
  )

const submitCredentials = () => {
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: CREDENTIALS.email }
  })
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: CREDENTIALS.password }
  })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('LoginScreen', () => {
  beforeEach(() => {
    mockReplace.mockReset()
    mockSignIn.mockReset()
    useToastStore.getState().clear()
  })

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

  test('signs in through the auth gateway and replaces the route with the home page', async () => {
    mockSignIn.mockResolvedValue(SESSION)
    renderLogin()

    submitCredentials()

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'))
    expect(mockReplace).toHaveBeenCalledOnce()
    expect(mockSignIn).toHaveBeenCalledOnce()
    expect(mockSignIn).toHaveBeenCalledWith(CREDENTIALS)
    expect(useToastStore.getState().toasts).toEqual([])
  })

  test('disables the submit button while the sign-in runs', async () => {
    mockSignIn.mockReturnValue(new Promise(() => {}))
    renderLogin()

    submitCredentials()

    const submit = await screen.findByRole('button', {
      name: 'Signing in…'
    })
    expect(submit).toBeDisabled()
    expect(mockSignIn).toHaveBeenCalledOnce()
  })

  test('queues the error toast and sets no field error when the sign-in fails', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid login credentials'))
    renderLogin()

    submitCredentials()

    await waitFor(() =>
      expect(useToastStore.getState().toasts).toEqual([
        expect.objectContaining({
          message: 'Something went wrong. Please try again.',
          variant: 'error'
        })
      ])
    )
    expect(
      screen.queryByText('Enter a valid email')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('Password is too short')
    ).not.toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
  })
})
