import { DEFAULT_LANGUAGE, LanguageEnum, resources } from '@app/i18n'
import { describe, expect, test } from 'vitest'

import { AsyncBoundaryDefaultLoading } from '@/components/ui/AsyncBoundary/AsyncBoundaryDefaultLoading.component'
import { renderWithIntl } from '@/test/intl.helper'
import { screen } from '@/test/test.helper'

describe('AsyncBoundaryDefaultLoading', () => {
  test('renders a status region with a loading label', () => {
    renderWithIntl({ ui: <AsyncBoundaryDefaultLoading /> })
    expect(screen.getByRole('status')).toHaveTextContent(
      resources[DEFAULT_LANGUAGE].translation.common.loading
    )
  })

  test('renders the loading label of the active language', () => {
    renderWithIntl({
      locale: LanguageEnum.ES,
      ui: <AsyncBoundaryDefaultLoading />
    })
    expect(screen.getByRole('status')).toHaveTextContent(
      resources[LanguageEnum.ES].translation.common.loading
    )
  })

  test('marks the spinner span as aria-hidden', () => {
    const { container } = renderWithIntl({
      ui: <AsyncBoundaryDefaultLoading />
    })
    const spinner = container.querySelector('[aria-hidden="true"]')
    expect(spinner).toBeTruthy()
  })
})
