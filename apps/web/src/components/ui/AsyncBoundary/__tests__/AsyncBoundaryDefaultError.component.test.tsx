import { DEFAULT_LANGUAGE, LanguageEnum, resources } from '@app/i18n'
import { describe, expect, test, vi } from 'vitest'

import { AsyncBoundaryDefaultError } from '@/components/ui/AsyncBoundary/AsyncBoundaryDefaultError.component'
import { renderWithIntl } from '@/test/intl.helper'
import { fireEvent, screen } from '@/test/test.helper'

const english = resources[DEFAULT_LANGUAGE].translation
const spanish = resources[LanguageEnum.ES].translation

describe('AsyncBoundaryDefaultError', () => {
  test('renders the error message when error is an Error instance', () => {
    renderWithIntl({
      ui: (
        <AsyncBoundaryDefaultError
          error={new Error('Something broke')}
          resetErrorBoundary={vi.fn()}
        />
      )
    })
    expect(screen.getByText('Something broke')).toBeTruthy()
  })

  test('renders fallback text when error is not an Error instance', () => {
    renderWithIntl({
      ui: (
        <AsyncBoundaryDefaultError
          error="oops"
          resetErrorBoundary={vi.fn()}
        />
      )
    })
    expect(screen.getByText(english.helper.error.generic)).toBeTruthy()
  })

  test('calls resetErrorBoundary when Retry is clicked', () => {
    const resetErrorBoundary = vi.fn()
    renderWithIntl({
      ui: (
        <AsyncBoundaryDefaultError
          error={new Error('err')}
          resetErrorBoundary={resetErrorBoundary}
        />
      )
    })
    fireEvent.click(
      screen.getByRole('button', { name: english.common.retry })
    )
    expect(resetErrorBoundary).toHaveBeenCalledOnce()
  })

  test('renders the generic message and Retry in the active language', () => {
    renderWithIntl({
      locale: LanguageEnum.ES,
      ui: (
        <AsyncBoundaryDefaultError
          error="oops"
          resetErrorBoundary={vi.fn()}
        />
      )
    })
    expect(screen.getByText(spanish.helper.error.generic)).toBeTruthy()
    expect(
      screen.getByRole('button', { name: spanish.common.retry })
    ).toBeTruthy()
  })

  test('has role=alert', () => {
    renderWithIntl({
      ui: (
        <AsyncBoundaryDefaultError
          error={new Error('err')}
          resetErrorBoundary={vi.fn()}
        />
      )
    })
    expect(screen.getByRole('alert')).toBeTruthy()
  })
})
