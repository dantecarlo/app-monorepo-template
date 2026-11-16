import { LanguageEnum, resources } from '@app/i18n'
import { afterEach, describe, expect, test } from 'vitest'

import { Toast } from '@/components/ui/Toast/Toast.component'
import { useToastStore } from '@/stores/toast.store'
import { renderWithI18n } from '@/test/i18n.helper'
import { fireEvent, screen, within } from '@/test/test.helper'

const seed = (): void =>
  useToastStore.setState({
    toasts: [{ id: '1', message: 'Could not load', variant: 'error' }]
  })

describe('Toast (mobile)', () => {
  afterEach(() => {
    useToastStore.setState({ toasts: [] })
  })

  test('module exports Toast as a function', () => {
    expect(typeof Toast).toBe('function')
  })

  test('removes a toast when its dismiss control is pressed', () => {
    seed()
    renderWithI18n({ ui: <Toast /> })
    expect(
      within(screen.getByRole('alert')).getByText('Could not load')
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(screen.queryByText('Could not load')).toBeNull()
  })

  test('labels the dismiss control in the active language', () => {
    seed()
    renderWithI18n({ language: LanguageEnum.ES, ui: <Toast /> })

    expect(
      screen.getByRole('button', {
        name: resources[LanguageEnum.ES].translation.common.dismiss
      })
    ).toBeTruthy()
  })
})
