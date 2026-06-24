import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

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
