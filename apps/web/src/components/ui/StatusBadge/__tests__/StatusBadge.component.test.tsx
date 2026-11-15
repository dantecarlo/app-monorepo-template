import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { StatusBadge } from '@/components/ui/StatusBadge/StatusBadge.component'

describe('StatusBadge', () => {
  test('renders the label', () => {
    render(<StatusBadge label="Active" />)
    expect(screen.getByText('Active')).toBeTruthy()
  })

  test('applies success tone class', () => {
    const { container } = render(<StatusBadge label="OK" tone="success" />)
    expect(container.firstChild?.toString()).toBeTruthy()
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('text-success-text')
  })

  test('applies danger tone class', () => {
    const { container } = render(
      <StatusBadge label="Error" tone="danger" />
    )
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('text-danger-text')
  })

  test('applies warning tone class', () => {
    const { container } = render(
      <StatusBadge label="Pending" tone="warning" />
    )
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('text-warning-text')
  })
})
