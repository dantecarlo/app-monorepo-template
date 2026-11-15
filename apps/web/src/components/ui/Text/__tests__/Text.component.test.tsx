import { describe, expect, test } from 'vitest'
import { axe } from 'vitest-axe'

import { Text } from '@/components/ui/Text/Text.component'
import { render, screen } from '@/test/test.helper'

const classesOf = (element: HTMLElement) =>
  element.className.split(' ').sort()

describe('Text', () => {
  test("renders a variant's typography on the element it is given", () => {
    render(
      <Text as="p" className="mb-3" variant="title">
        Items
      </Text>
    )
    const text = screen.getByText('Items')

    expect(text.tagName).toBe('P')
    expect(classesOf(text)).toEqual(
      [
        'font-display',
        'font-semibold',
        'mb-3',
        'text-text-primary',
        'text-title'
      ].sort()
    )
  })

  test('has no accessibility violations', async () => {
    const { container } = render(<Text variant="caption">Updated</Text>)
    expect(await axe(container)).toHaveNoViolations()
  })

  test('applies the tone and the weight on their own', () => {
    render(
      <Text tone="success" weight="semibold">
        12
      </Text>
    )
    const text = screen.getByText('12')

    expect(text.tagName).toBe('SPAN')
    expect(classesOf(text)).toEqual(['font-semibold', 'text-success-text'])
  })

  test('keeps both colours when a tone is set beside a variant', () => {
    render(
      <Text tone="success" variant="title">
        Paid
      </Text>
    )

    expect(classesOf(screen.getByText('Paid'))).toEqual(
      [
        'font-display',
        'font-semibold',
        'text-success-text',
        'text-text-primary',
        'text-title'
      ].sort()
    )
  })

  test('keeps every class of a variant whose size is a token', () => {
    render(<Text variant="amountHero">42</Text>)

    expect(classesOf(screen.getByText('42'))).toEqual(
      [
        'font-display',
        'font-extrabold',
        'tabular-nums',
        'text-amount-hero',
        'text-text-primary'
      ].sort()
    )
  })
})
