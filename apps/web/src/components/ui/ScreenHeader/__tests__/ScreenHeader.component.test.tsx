import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader.component'

describe('ScreenHeader', () => {
  test('renders the title', () => {
    render(<ScreenHeader backLabel="Go back" title="Settings" />)
    expect(screen.getByText('Settings')).toBeTruthy()
  })

  test('renders the back button when onBack is provided', () => {
    render(
      <ScreenHeader
        backLabel="Go back"
        onBack={vi.fn()}
        title="Settings"
      />
    )
    expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy()
  })

  test('does not render a back button when onBack is absent', () => {
    render(<ScreenHeader backLabel="Go back" title="Settings" />)
    expect(screen.queryByRole('button', { name: 'Go back' })).toBeNull()
  })

  test('renders the trailing action when name, label and handler are all present', () => {
    render(
      <ScreenHeader
        actionLabel="Edit"
        actionName="edit"
        backLabel="Go back"
        onAction={vi.fn()}
        title="Settings"
      />
    )
    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy()
  })

  test('is exported as a function', () => {
    expect(typeof ScreenHeader).toBe('function')
  })
})
