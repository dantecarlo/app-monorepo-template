import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { AuthField } from '@/components/ui/AuthField/AuthField.component'

describe('AuthField', () => {
  test('renders label when provided', () => {
    render(
      <AuthField
        hidePasswordLabel="Hide"
        id="email"
        label="Email"
        showPasswordLabel="Show"
      />
    )
    expect(screen.getByText('Email')).toBeTruthy()
  })

  test('renders helper text when provided', () => {
    render(
      <AuthField
        helperText="Enter your email"
        hidePasswordLabel="Hide"
        id="email"
        showPasswordLabel="Show"
      />
    )
    expect(screen.getByText('Enter your email')).toBeTruthy()
  })

  test('shows password reveal button when isPassword is true', () => {
    render(
      <AuthField
        hidePasswordLabel="Hide password"
        id="password"
        isPassword
        showPasswordLabel="Show password"
      />
    )
    expect(
      screen.getByRole('button', { name: 'Show password' })
    ).toBeTruthy()
  })

  test('toggles reveal button label on click', () => {
    render(
      <AuthField
        hidePasswordLabel="Hide password"
        id="password"
        isPassword
        showPasswordLabel="Show password"
      />
    )
    const toggle = screen.getByRole('button', { name: 'Show password' })
    fireEvent.click(toggle)
    expect(
      screen.getByRole('button', { name: 'Hide password' })
    ).toBeTruthy()
  })

  test('is exported as a function', () => {
    expect(typeof AuthField).toBe('function')
  })
})
