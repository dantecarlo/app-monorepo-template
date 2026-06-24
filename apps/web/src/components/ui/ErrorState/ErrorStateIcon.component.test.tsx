import { render } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { ErrorStateIcon } from './ErrorStateIcon.component'

describe('ErrorStateIcon', () => {
  test('renders an svg element marked as aria-hidden', () => {
    const { container } = render(<ErrorStateIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
  })
})
