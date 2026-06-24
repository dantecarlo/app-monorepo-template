import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { SocialAuthButton } from '@/components/ui/SocialAuthButton/SocialAuthButton.component'

describe('SocialAuthButton', () => {
  test('renders the label', () => {
    render(
      <SocialAuthButton
        label="Continue with Google"
        loadingLabel="Loading..."
      />
    )
    expect(screen.getByText('Continue with Google')).toBeTruthy()
  })

  test('renders the loading label when isLoading is true', () => {
    render(
      <SocialAuthButton
        isLoading
        label="Continue with Google"
        loadingLabel="Loading..."
      />
    )
    expect(screen.getByText('Loading...')).toBeTruthy()
  })

  test('disables the button when isLoading is true', () => {
    render(
      <SocialAuthButton
        isLoading
        label="Continue with Google"
        loadingLabel="Loading..."
      />
    )
    expect(screen.getByRole('button')).toBeDisabled()
  })

  test('is exported as a function', () => {
    expect(typeof SocialAuthButton).toBe('function')
  })
})
