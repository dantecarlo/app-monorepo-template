import { LanguageEnum, resources } from '@app/i18n'
import { describe, expect, test, vi } from 'vitest'

import { AsyncBoundaryDefaultError } from '@/components/ui/AsyncBoundary/AsyncBoundaryDefaultError.component'
import { renderWithI18n } from '@/test/i18n.helper'
import { fireEvent, screen, within } from '@/test/test.helper'

const spanish = resources[LanguageEnum.ES].translation

describe('AsyncBoundaryDefaultError (mobile)', () => {
  test('shows the generic message and the retry label in the active language', () => {
    const resetErrorBoundary = vi.fn()
    renderWithI18n({
      language: LanguageEnum.ES,
      ui: (
        <AsyncBoundaryDefaultError
          error="oops"
          resetErrorBoundary={resetErrorBoundary}
        />
      )
    })

    expect(
      within(screen.getByRole('alert')).getByText(
        spanish.helper.error.generic
      )
    ).toBeTruthy()
    fireEvent.click(
      screen.getByRole('button', { name: spanish.common.retry })
    )
    expect(resetErrorBoundary).toHaveBeenCalledOnce()
  })

  test('shows the message of a thrown error', () => {
    renderWithI18n({
      ui: (
        <AsyncBoundaryDefaultError
          error={new Error('Something broke')}
          resetErrorBoundary={vi.fn()}
        />
      )
    })

    expect(
      within(screen.getByRole('alert')).getByText('Something broke')
    ).toBeTruthy()
  })
})
