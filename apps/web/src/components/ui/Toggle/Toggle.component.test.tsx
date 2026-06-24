import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { Toggle } from '@/components/ui/Toggle/Toggle.component'

describe('Toggle', () => {
  test('renders a switch role', () => {
    render(
      <Toggle
        accessibilityLabel="Notificaciones push"
        onValueChange={vi.fn()}
        value={false}
      />
    )
    expect(screen.getByRole('switch')).toBeTruthy()
  })

  test('reflects value in aria-checked', () => {
    render(
      <Toggle
        accessibilityLabel="Notificaciones push"
        onValueChange={vi.fn()}
        value
      />
    )
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe(
      'true'
    )
  })

  test('calls onValueChange with the toggled value', () => {
    const onValueChange = vi.fn()
    render(
      <Toggle
        accessibilityLabel="Notificaciones push"
        onValueChange={onValueChange}
        value={false}
      />
    )
    fireEvent.click(screen.getByRole('switch'))
    expect(onValueChange).toHaveBeenCalledWith(true)
  })

  test('is exported as a function', () => {
    expect(typeof Toggle).toBe('function')
  })
})
