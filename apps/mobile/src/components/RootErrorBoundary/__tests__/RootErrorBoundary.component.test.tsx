import { beforeEach, describe, expect, test, vi } from 'vitest'

import { fireEvent, render, screen, within } from '@/test/test.helper'

vi.mock('@/lib/i18n/useAppTranslator.hook', () => ({
  useAppTranslator: () => ({
    has: () => false,
    locale: 'en',
    t: (key: string) => key
  })
}))

const { mockCaptureError } = vi.hoisted(() => ({
  mockCaptureError: vi.fn()
}))

vi.mock('@/lib/observability/observability.adapter', () => ({
  observability: { captureError: mockCaptureError }
}))

import { RootErrorBoundary } from '@/components/RootErrorBoundary/RootErrorBoundary.component'
import { BOUNDARY_ERROR_SOURCE } from '@/lib/observability/observability.constant'

describe('RootErrorBoundary', () => {
  beforeEach(() => {
    mockCaptureError.mockClear()
  })

  test('renders the generic error state for a render crash', () => {
    render(
      <RootErrorBoundary
        error={new Error('render failed')}
        retry={vi.fn().mockResolvedValue(undefined)}
      />
    )

    const alert = within(screen.getByRole('alert'))
    expect(alert.getByText('components.errorState.title')).toBeTruthy()
    expect(alert.getByText('components.errorState.message')).toBeTruthy()
  })

  test('calls retry when the retry control is pressed', () => {
    const retry = vi.fn().mockResolvedValue(undefined)
    render(
      <RootErrorBoundary
        error={new Error('render failed')}
        retry={retry}
      />
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'components.errorState.retry' })
    )

    expect(retry).toHaveBeenCalledOnce()
  })

  test('reports the crash to observability once', () => {
    const error = new Error('render failed')
    const retry = vi.fn().mockResolvedValue(undefined)
    const { rerender } = render(
      <RootErrorBoundary error={error} retry={retry} />
    )

    rerender(<RootErrorBoundary error={error} retry={retry} />)

    expect(mockCaptureError).toHaveBeenCalledOnce()
    expect(mockCaptureError).toHaveBeenCalledWith({
      context: { source: BOUNDARY_ERROR_SOURCE },
      error
    })
  })
})
