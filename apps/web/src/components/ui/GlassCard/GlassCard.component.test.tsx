import { describe, expect, test } from 'vitest'
import { axe } from 'vitest-axe'

import { GlassCard } from '@/components/ui/GlassCard/GlassCard.component'
import { render, screen } from '@/test/test.helper'

describe('GlassCard', () => {
  test('renders its children', () => {
    render(
      <GlassCard>
        <p>Card body</p>
      </GlassCard>
    )
    expect(screen.getByText('Card body')).toBeInTheDocument()
  })

  test('has no accessibility violations', async () => {
    const { container } = render(
      <GlassCard>
        <p>Card body</p>
      </GlassCard>
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  test('forwards arbitrary HTML attributes to the root element', () => {
    render(
      <GlassCard aria-label="summary card">
        <p>Card body</p>
      </GlassCard>
    )
    expect(screen.getByLabelText('summary card')).toBeInTheDocument()
  })
})
