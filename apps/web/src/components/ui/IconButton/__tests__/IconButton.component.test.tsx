import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { IconButton } from '@/components/ui/IconButton/IconButton.component'

describe('IconButton', () => {
  test('renders a button with aria-label', () => {
    render(<IconButton accessibilityLabel="Close" name="close" />)
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy()
  })

  test('applies glass variant class by default', () => {
    const { container } = render(
      <IconButton accessibilityLabel="Search" name="search" />
    )
    const button = container.querySelector('button')
    expect(button?.className).toContain('glass-card')
  })

  test('applies accent variant class', () => {
    const { container } = render(
      <IconButton
        accessibilityLabel="Settings"
        name="settings"
        variant="accent"
      />
    )
    const button = container.querySelector('button')
    expect(button?.className).toContain('bg-accent')
  })

  test('is exported as a function', () => {
    expect(typeof IconButton).toBe('function')
  })
})
