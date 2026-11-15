import { render } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { Avatar } from '@/components/ui/Avatar/Avatar.component'

describe('Avatar', () => {
  test('renders initials', () => {
    const { container } = render(<Avatar initials="AB" />)
    expect(container.textContent).toBe('AB')
  })

  test('is aria-hidden (decorative)', () => {
    const { container } = render(<Avatar initials="CD" />)
    const span = container.querySelector('span')
    expect(span?.getAttribute('aria-hidden')).toBe('true')
  })

  test('applies accent variant', () => {
    const { container } = render(<Avatar initials="EF" variant="accent" />)
    const span = container.querySelector('span')
    expect(span?.className).toContain('bg-accent-tint')
  })

  test('keeps its glyph size beside its text colour', () => {
    const { container } = render(
      <Avatar initials="GH" size={28} variant="accent" />
    )
    const span = container.querySelector('span')

    expect(span?.className.split(' ').sort()).toEqual(
      [
        'bg-accent-tint',
        'font-body',
        'font-semibold',
        'h-7',
        'inline-flex',
        'items-center',
        'justify-center',
        'rounded-full',
        'select-none',
        'text-accent-text',
        'text-initials-sm',
        'w-7'
      ].sort()
    )
  })

  test('is exported as a function', () => {
    expect(typeof Avatar).toBe('function')
  })
})
