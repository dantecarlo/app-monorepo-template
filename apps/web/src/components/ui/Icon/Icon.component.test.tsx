import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { Icon } from '@/components/ui/Icon/Icon.component'

describe('Icon', () => {
  test('renders an svg element', () => {
    const { container } = render(<Icon name="search" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })

  test('is aria-hidden when decorative', () => {
    const { container } = render(<Icon decorative name="search" />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
  })

  test('exposes role=img when not decorative', () => {
    render(<Icon decorative={false} label="Search" name="search" />)
    expect(screen.getByRole('img', { name: 'Search' })).toBeTruthy()
  })

  test('is exported as a function', () => {
    expect(typeof Icon).toBe('function')
  })
})
