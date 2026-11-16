import { LanguageEnum, resources } from '@app/i18n'
import { describe, expect, test } from 'vitest'

import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton/LoadingSkeleton.component'
import { renderWithIntl } from '@/test/intl.helper'
import { screen } from '@/test/test.helper'

describe('LoadingSkeleton', () => {
  test('renders with role=status', () => {
    renderWithIntl({ ui: <LoadingSkeleton /> })
    expect(screen.getByRole('status')).toBeTruthy()
  })

  test('is marked aria-busy', () => {
    renderWithIntl({ ui: <LoadingSkeleton /> })
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe(
      'true'
    )
  })

  test('applies rounded-full variant class', () => {
    renderWithIntl({ ui: <LoadingSkeleton rounded="full" /> })
    const el = screen.getByRole('status')
    expect(el.className).toContain('rounded-full')
  })

  test('applies custom dimensions via style', () => {
    renderWithIntl({ ui: <LoadingSkeleton height="40px" width="200px" /> })
    const el = screen.getByRole('status')
    expect(el.style.height).toBe('40px')
    expect(el.style.width).toBe('200px')
  })

  test('labels the skeleton in the active language', () => {
    renderWithIntl({ locale: LanguageEnum.ES, ui: <LoadingSkeleton /> })

    expect(
      screen.getByRole('status', {
        name: resources[LanguageEnum.ES].translation.common.loading
      })
    ).toBeInTheDocument()
  })
})
