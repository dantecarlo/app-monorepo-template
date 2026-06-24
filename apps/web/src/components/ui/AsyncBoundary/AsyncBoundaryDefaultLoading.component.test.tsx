import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { AsyncBoundaryDefaultLoading } from './AsyncBoundaryDefaultLoading.component'

describe('AsyncBoundaryDefaultLoading', () => {
  test('renders a status region with a loading label', () => {
    render(<AsyncBoundaryDefaultLoading />)
    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.getByText('Loading…')).toBeTruthy()
  })

  test('marks the spinner span as aria-hidden', () => {
    const { container } = render(<AsyncBoundaryDefaultLoading />)
    const spinner = container.querySelector('[aria-hidden="true"]')
    expect(spinner).toBeTruthy()
  })
})
