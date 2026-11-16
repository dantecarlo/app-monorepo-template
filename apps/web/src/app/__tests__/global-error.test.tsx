import { DEFAULT_LANGUAGE, LanguageEnum, resources } from '@app/i18n'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const { mockCaptureError } = vi.hoisted(() => ({
  mockCaptureError: vi.fn()
}))

vi.mock('@/lib/observability/observability.adapter', () => ({
  observability: { captureError: mockCaptureError }
}))

import GlobalError from '@/app/global-error'
import { LOCALE_COOKIE_NAME } from '@/i18n/i18n.constant'
import { BOUNDARY_ERROR_SOURCE } from '@/lib/observability/observability.constant'
import { render, screen } from '@/test/test.helper'

const errorStateCopy =
  resources[DEFAULT_LANGUAGE].translation.components.errorState

describe('GlobalError', () => {
  beforeEach(() => {
    mockCaptureError.mockClear()
  })

  afterEach(() => {
    document.cookie = `${LOCALE_COOKIE_NAME}=;path=/;max-age=0`
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

  test('renders the error state in the language of the locale cookie', () => {
    const spanishCopy =
      resources[LanguageEnum.ES].translation.components.errorState
    document.cookie = `${LOCALE_COOKIE_NAME}=${LanguageEnum.ES};path=/`

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
      LanguageEnum.ES
    )
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(spanishCopy.title)
    expect(alert).toHaveTextContent(spanishCopy.message)
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
