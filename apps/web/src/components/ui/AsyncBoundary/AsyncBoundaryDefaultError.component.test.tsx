import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { AsyncBoundaryDefaultError } from './AsyncBoundaryDefaultError.component'

describe('AsyncBoundaryDefaultError', () => {
  test('renders the error message when error is an Error instance', () => {
    const resetErrorBoundary = vi.fn()
    render(
      <AsyncBoundaryDefaultError
        error={new Error('Something broke')}
        resetErrorBoundary={resetErrorBoundary}
      />
    )
    expect(screen.getByText('Something broke')).toBeTruthy()
  })

  test('renders fallback text when error is not an Error instance', () => {
    const resetErrorBoundary = vi.fn()
    render(
      <AsyncBoundaryDefaultError
        error="oops"
        resetErrorBoundary={resetErrorBoundary}
      />
    )
    expect(screen.getByText('An error occurred')).toBeTruthy()
  })

  test('calls resetErrorBoundary when Retry is clicked', () => {
    const resetErrorBoundary = vi.fn()
    render(
      <AsyncBoundaryDefaultError
        error={new Error('err')}
        resetErrorBoundary={resetErrorBoundary}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(resetErrorBoundary).toHaveBeenCalledOnce()
  })

  test('has role=alert', () => {
    render(
      <AsyncBoundaryDefaultError
        error={new Error('err')}
        resetErrorBoundary={vi.fn()}
      />
    )
    expect(screen.getByRole('alert')).toBeTruthy()
  })
})
