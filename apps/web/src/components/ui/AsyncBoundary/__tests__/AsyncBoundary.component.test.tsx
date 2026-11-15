import { describe, expect, test } from 'vitest'
import { axe } from 'vitest-axe'

import { AsyncBoundary } from '@/components/ui/AsyncBoundary/AsyncBoundary.component'
import { render, screen } from '@/test/test.helper'

describe('AsyncBoundary', () => {
  test('renders its children when nothing suspends or throws', () => {
    render(
      <AsyncBoundary>
        <p>Loaded content</p>
      </AsyncBoundary>
    )
    expect(screen.getByText('Loaded content')).toBeInTheDocument()
  })

  test('has no accessibility violations', async () => {
    const { container } = render(
      <AsyncBoundary>
        <p>Loaded content</p>
      </AsyncBoundary>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
