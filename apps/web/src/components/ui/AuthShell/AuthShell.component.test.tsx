import { render, screen } from '@testing-library/react'
import type { ImgHTMLAttributes } from 'react'
import { describe, expect, test, vi } from 'vitest'

vi.mock('next-intl', () => ({
  // eslint-disable-next-line local/single-object-params -- mirrors next-intl's t(key, values) callback shape
  useTranslations: () => (key: string, values?: Record<string, string>) =>
    values?.name ? `${values.name} ${key}` : key
}))

vi.mock('next/image', () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element -- test stub mirroring next/image
    <img {...props} />
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
