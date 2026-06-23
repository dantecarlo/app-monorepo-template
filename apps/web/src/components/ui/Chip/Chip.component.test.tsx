import { describe, expect, test } from 'vitest'
import { axe } from 'vitest-axe'

import { Chip } from '@/components/ui/Chip/Chip.component'
import { render, screen } from '@/test/test.helper'

describe('Chip', () => {
  test('renders its label', () => {
    render(<Chip>Active</Chip>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  test('has no accessibility violations', async () => {
    const { container } = render(<Chip variant="success">Active</Chip>)
    expect(await axe(container)).toHaveNoViolations()
  })

  test('renders a decorative status dot when withDot is set', () => {
    const { container } = render(
      <Chip variant="success" withDot>
        Active
      </Chip>
    )
    // The dot is decorative (aria-hidden), so it is queried structurally.
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })

  test('omits the status dot by default', () => {
    const { container } = render(<Chip>Active</Chip>)
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
  })
})
