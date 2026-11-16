import { DEFAULT_LANGUAGE, resources } from '@app/i18n'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const { mockCaptureError } = vi.hoisted(() => ({
  mockCaptureError: vi.fn()
}))

vi.mock('@/lib/observability/observability.adapter', () => ({
  observability: { captureError: mockCaptureError }
}))

import GlobalError from '@/app/global-error'
import { BOUNDARY_ERROR_SOURCE } from '@/lib/observability/observability.constant'
import { render, screen } from '@/test/test.helper'

const errorStateCopy =
  resources[DEFAULT_LANGUAGE].translation.components.errorState

describe('GlobalError', () => {
  beforeEach(() => {
    mockCaptureError.mockClear()
  })

  test('renders the generic error state in its own document', () => {
    render(
      <GlobalError
        error={new Error('layout failed')}
        reset={vi.fn()}
        unstable_retry={vi.fn()}
      />,
      { container: document }
    )

    expect(document.documentElement).toHaveAttribute(
      'lang',
      DEFAULT_LANGUAGE
    )
    const alert = screen.getByRole('alert')
    expect(document.body).toContainElement(alert)
    expect(alert).toHaveTextContent(errorStateCopy.title)
    expect(alert).toHaveTextContent(errorStateCopy.message)
  })

  test('reports the root layout crash to observability once', () => {
    const error = new Error('layout failed')
    const retry = vi.fn()
    const { rerender } = render(
      <GlobalError error={error} reset={vi.fn()} unstable_retry={retry} />,
      { container: document }
    )

    rerender(
      <GlobalError error={error} reset={vi.fn()} unstable_retry={retry} />
    )

    expect(mockCaptureError).toHaveBeenCalledOnce()
    expect(mockCaptureError).toHaveBeenCalledWith({
      context: { source: BOUNDARY_ERROR_SOURCE },
      error
    })
  })
})
