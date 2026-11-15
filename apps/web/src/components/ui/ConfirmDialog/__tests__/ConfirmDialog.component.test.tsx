import { fireEvent, render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test, vi } from 'vitest'

import { ConfirmDialog } from '@/components/ui/ConfirmDialog/ConfirmDialog.component'

const messages = {
  common: { cancel: 'Cancel', confirm: 'Confirm' },
  components: { modal: { close: 'Close' } }
}

const renderDialog = (
  props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}
) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ConfirmDialog
        isOpen={true}
        message="Are you sure?"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        {...props}
      />
    </NextIntlClientProvider>
  )

describe('ConfirmDialog', () => {
  test('renders the message', () => {
    renderDialog()
    expect(screen.getByText('Are you sure?')).toBeTruthy()
  })

  test('uses default i18n labels', () => {
    renderDialog()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy()
  })

  test('uses custom labels when provided', () => {
    renderDialog({ cancelLabel: 'No', confirmLabel: 'Yes' })
    expect(screen.getByRole('button', { name: 'Yes' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'No' })).toBeTruthy()
  })

  test('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn()
    renderDialog({ onConfirm })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  test('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn()
    renderDialog({ onCancel })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
