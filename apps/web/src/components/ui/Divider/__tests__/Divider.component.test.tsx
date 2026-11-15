import { describe, expect, test } from 'vitest'
import { axe } from 'vitest-axe'

import { Divider } from '@/components/ui/Divider/Divider.component'
import { render, screen } from '@/test/test.helper'

describe('Divider', () => {
  test('renders the label between two rules', () => {
    const { container } = render(<Divider className="my-6" label="or" />)
    const root = container.firstElementChild as HTMLElement
    const [before, label, after] = Array.from(root.children) as [
      HTMLElement,
      HTMLElement,
      HTMLElement
    ]

    expect(root.className).toBe('flex items-center gap-3 my-6')
    expect(label).toBe(screen.getByText('or'))
    expect(label.className).toBe(
      'font-body text-caption text-text-tertiary'
    )
    for (const rule of [before, after]) {
      expect(rule).toHaveAttribute('aria-hidden', 'true')
      expect(rule.className).toBe('h-px flex-1 bg-divider')
    }
  })

  test('has no accessibility violations', async () => {
    const { container } = render(<Divider label="or" />)
    expect(await axe(container)).toHaveNoViolations()
  })

  test('renders a single rule without a label', () => {
    const { container } = render(<Divider />)
    const root = container.firstElementChild as HTMLElement

    expect(root.children).toHaveLength(1)
    expect(root.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})
