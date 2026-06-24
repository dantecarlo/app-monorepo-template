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

  test('is exported as a function', () => {
    expect(typeof Avatar).toBe('function')
  })
})
