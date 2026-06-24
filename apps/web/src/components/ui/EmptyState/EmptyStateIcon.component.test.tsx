import { render } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { EmptyStateIcon } from './EmptyStateIcon.component'

describe('EmptyStateIcon', () => {
  test('renders an svg element marked as aria-hidden', () => {
    const { container } = render(<EmptyStateIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
  })
})
