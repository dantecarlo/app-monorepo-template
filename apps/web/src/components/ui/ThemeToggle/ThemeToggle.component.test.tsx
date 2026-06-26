import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key
}))

const onValueChange = vi.fn()
let isLight = false

vi.mock('@/components/ui/ThemeToggle/useThemeToggle.hook', () => ({
  useThemeToggle: () => ({ isLight, onValueChange })
}))

import { ThemeToggle } from './ThemeToggle.component'

describe('ThemeToggle', () => {
  test('renders a switch reflecting the dark theme as off', () => {
    isLight = false
    render(<ThemeToggle />)
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe(
      'false'
    )
  })

  test('renders the switch as on when the theme is light', () => {
    isLight = true
    render(<ThemeToggle />)
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe(
      'true'
    )
  })

  test('uses the provided accessibility label', () => {
    isLight = false
    render(<ThemeToggle accessibilityLabel="Theme" />)
    expect(screen.getByLabelText('Theme')).toBeTruthy()
  })
})
