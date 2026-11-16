import { LanguageEnum, resources } from '@app/i18n'
import { afterEach, describe, expect, test } from 'vitest'
import { axe } from 'vitest-axe'

import { Toast } from '@/components/ui/Toast/Toast.component'
import { useToastStore } from '@/stores/toast.store'
import { renderWithIntl } from '@/test/intl.helper'
import { act, screen } from '@/test/test.helper'

const resetStore = (): void => useToastStore.setState({ toasts: [] })

const seed = (message: string): void =>
  useToastStore.setState({
    toasts: [{ id: '1', message, variant: 'success' }]
  })

describe('Toast', () => {
  afterEach(() => {
    resetStore()
  })

  test('renders a toast message from the store', () => {
    seed('Saved successfully')
    renderWithIntl({ ui: <Toast /> })
    expect(screen.getByText('Saved successfully')).toBeInTheDocument()
  })

  test('has no accessibility violations', async () => {
    seed('Saved successfully')
    const { container } = renderWithIntl({ ui: <Toast /> })
    expect(await axe(container)).toHaveNoViolations()
  })

  test('renders an empty live region when there are no toasts', () => {
    resetStore()
    renderWithIntl({ ui: <Toast /> })
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  test('removes a toast when its dismiss button is pressed', () => {
    seed('Saved successfully')
    renderWithIntl({ ui: <Toast /> })
    act(() => {
      screen.getByRole('button', { name: 'Dismiss' }).click()
    })
    expect(
      screen.queryByText('Saved successfully')
    ).not.toBeInTheDocument()
  })

  test('labels the dismiss button in the active language', () => {
    seed('Saved successfully')
    renderWithIntl({ locale: LanguageEnum.ES, ui: <Toast /> })

    expect(
      screen.getByRole('button', {
        name: resources[LanguageEnum.ES].translation.common.dismiss
      })
    ).toBeInTheDocument()
  })
})
