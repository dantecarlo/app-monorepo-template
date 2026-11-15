import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { ListRow } from '@/components/ui/ListRow/ListRow.component'

describe('ListRow', () => {
  test('renders the title', () => {
    render(<ListRow title="Account" />)
    expect(screen.getByText('Account')).toBeTruthy()
  })

  test('renders subtitle when provided', () => {
    render(<ListRow subtitle="Details" title="Account" />)
    expect(screen.getByText('Details')).toBeTruthy()
  })

  test('renders as a button when onClick is provided', () => {
    render(<ListRow onClick={vi.fn()} title="Account" />)
    expect(screen.getByRole('button')).toBeTruthy()
  })

  test('renders as a div when onClick is absent', () => {
    const { container } = render(<ListRow title="Account" />)
    expect(container.querySelector('div')).toBeTruthy()
    expect(container.querySelector('button')).toBeNull()
  })

  test('is exported as a function', () => {
    expect(typeof ListRow).toBe('function')
  })
})
