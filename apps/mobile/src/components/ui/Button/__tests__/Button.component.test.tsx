import { LanguageEnum, resources } from '@app/i18n'
import { describe, expect, test } from 'vitest'

import { Button } from '@/components/ui/Button/Button.component'
import { renderWithI18n } from '@/test/i18n.helper'
import { screen } from '@/test/test.helper'

describe('Button', () => {
  test('is exported as a function', () => {
    expect(typeof Button).toBe('function')
  })

  test('labels its busy indicator in the active language', () => {
    renderWithI18n({
      language: LanguageEnum.ES,
      ui: <Button isLoading>Save</Button>
    })

    expect(
      screen.getByLabelText(
        resources[LanguageEnum.ES].translation.common.loading
      )
    ).toBeTruthy()
  })
})
