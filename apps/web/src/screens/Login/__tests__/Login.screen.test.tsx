import { AppError, type IAuthSession } from '@app/core'
import { DEFAULT_LANGUAGE, resources } from '@app/i18n'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { AppI18nProvider } from '@/lib/i18n/AppI18nProvider.component'
import { AppQueryProvider } from '@/lib/query/AppQueryProvider.component'
import { withCopy } from '@/test/intl.helper'
import { createTestQueryClient } from '@/test/query.helper'

const { mockReplace, mockSignIn } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockSignIn: vi.fn()
}))

vi.mock('@/lib/routing', async () =>
  (await import('@/test/routing.helper')).createRoutingDouble({
    router: { replace: mockReplace }
  })
)

vi.mock('@/lib/supabase/authGateway.adapter', () => ({
  getAuthGateway: () => ({ signIn: mockSignIn })
}))

vi.mock('@/components/ThemeProvider/useTheme.hook', () => ({
  useTheme: () => ({ setTheme: vi.fn(), theme: 'dark' })
}))

vi.mock('@/components/ui/Image/Image.component', () => ({
  Image: ({ alt, src }: { alt: string; src: string }) => (
    <img alt={alt} src={src} />
  )
}))

import {
  SIGN_IN_FAILURE_MESSAGE_KEY,
  SignInFailureEnum
} from '@/lib/supabase/authGateway.constant'
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
    error: resources[DEFAULT_LANGUAGE].translation.auth.error,
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
    <AppQueryProvider client={createTestQueryClient()}>
      <AppI18nProvider locale="en" messages={withCopy({ copy: messages })}>
        <LoginScreen />
      </AppI18nProvider>
    </AppQueryProvider>
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

  test('shows the message of the failure the gateway names', async () => {
    mockSignIn.mockRejectedValue(
      new AppError({
        code: SignInFailureEnum.INVALID_CREDENTIALS,
        messageKey:
          SIGN_IN_FAILURE_MESSAGE_KEY[
            SignInFailureEnum.INVALID_CREDENTIALS
          ]
      })
    )
    renderLogin()

    submitCredentials()

    await waitFor(() =>
      expect(useToastStore.getState().toasts).toEqual([
        expect.objectContaining({
          message:
            resources[DEFAULT_LANGUAGE].translation.auth.error
              .invalidCredentials,
          variant: 'error'
        })
      ])
    )
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
