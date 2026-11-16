import { LanguageEnum, resources } from '@app/i18n'
import { describe, expect, test } from 'vitest'

import { AsyncBoundaryDefaultLoading } from '@/components/ui/AsyncBoundary/AsyncBoundaryDefaultLoading.component'
import { renderWithI18n } from '@/test/i18n.helper'
import { screen } from '@/test/test.helper'

describe('AsyncBoundaryDefaultLoading (mobile)', () => {
  test('labels the loading region in the active language', () => {
    renderWithI18n({
      language: LanguageEnum.ES,
      ui: <AsyncBoundaryDefaultLoading />
    })

    expect(
      screen.getByLabelText(
        resources[LanguageEnum.ES].translation.common.loading
      )
    ).toBeTruthy()
  })
})
