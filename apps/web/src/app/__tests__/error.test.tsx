import { DEFAULT_LANGUAGE, resources } from '@app/i18n'
import { NextIntlClientProvider } from 'next-intl'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const { mockCaptureError } = vi.hoisted(() => ({
  mockCaptureError: vi.fn()
}))

vi.mock('@/lib/observability/observability.adapter', () => ({
  observability: { captureError: mockCaptureError }
}))

import RouteError from '@/app/error'
import { BOUNDARY_ERROR_SOURCE } from '@/lib/observability/observability.constant'
import { fireEvent, render, screen } from '@/test/test.helper'

const messages = resources[DEFAULT_LANGUAGE].translation
const errorStateCopy = messages.components.errorState

const routeError = ({
  error,
  retry
}: {
  error: Error
  retry: () => void
}) => (
  <NextIntlClientProvider locale={DEFAULT_LANGUAGE} messages={messages}>
    <RouteError error={error} reset={vi.fn()} unstable_retry={retry} />
  </NextIntlClientProvider>
)

const renderRouteError = ({ retry }: { retry: () => void }) =>
  render(routeError({ error: new Error('render failed'), retry }))

describe('RouteError', () => {
  beforeEach(() => {
    mockCaptureError.mockClear()
  })

  test('renders the generic error state for a render crash', () => {
    renderRouteError({ retry: vi.fn() })

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(errorStateCopy.title)
    expect(alert).toHaveTextContent(errorStateCopy.message)
  })

  test('retries the segment when Try again is pressed', () => {
    const retry = vi.fn()
    renderRouteError({ retry })

    fireEvent.click(
      screen.getByRole('button', { name: errorStateCopy.retry })
    )

    expect(retry).toHaveBeenCalledOnce()
  })

  test('reports the crash to observability once', () => {
    const error = new Error('render failed')
    const retry = vi.fn()
    const { rerender } = render(routeError({ error, retry }))

    rerender(routeError({ error, retry }))

    expect(mockCaptureError).toHaveBeenCalledOnce()
    expect(mockCaptureError).toHaveBeenCalledWith({
      context: { source: BOUNDARY_ERROR_SOURCE },
      error
    })
  })

  test('reports the crash once across a rerender, an unmount and a new render', () => {
    const error = new Error('render failed')
    const retry = vi.fn()
    const { rerender, unmount } = render(routeError({ error, retry }))

    rerender(routeError({ error, retry }))
    unmount()
    render(routeError({ error, retry }))

    expect(mockCaptureError).toHaveBeenCalledOnce()
  })
})
