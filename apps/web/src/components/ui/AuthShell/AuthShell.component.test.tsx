import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  // eslint-disable-next-line local/single-object-params -- mirrors next-intl's t(key, values) callback shape
  useTranslations: () => (key: string, values?: Record<string, string>) =>
    values?.name ? `${values.name} ${key}` : key
}))

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

import { AuthShell } from '@/components/ui/AuthShell/AuthShell.component'

describe('AuthShell', () => {
  test('renders the brand label', () => {
    render(
      <AuthShell brandLabel="MyApp" title="Sign in">
        <p>form</p>
      </AuthShell>
    )
    expect(screen.getByText('MyApp')).toBeTruthy()
  })

  test('renders the title', () => {
    render(
      <AuthShell brandLabel="MyApp" title="Sign in">
        <p>form</p>
      </AuthShell>
    )
    expect(screen.getByText('Sign in')).toBeTruthy()
  })

  test('renders subtitle when provided', () => {
    render(
      <AuthShell
        brandLabel="MyApp"
        subtitle="Welcome back"
        title="Sign in"
      >
        <p>form</p>
      </AuthShell>
    )
    expect(screen.getByText('Welcome back')).toBeTruthy()
  })

  test('renders children inside the form card', () => {
    render(
      <AuthShell brandLabel="MyApp" title="Sign in">
        <input aria-label="email" />
      </AuthShell>
    )
    expect(screen.getByLabelText('email')).toBeTruthy()
  })

  test('is exported as a function', () => {
    expect(typeof AuthShell).toBe('function')
  })
})
