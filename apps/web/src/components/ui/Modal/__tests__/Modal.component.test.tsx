import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { Modal } from '@/components/ui/Modal/Modal.component'
import { AppI18nProvider } from '@/lib/i18n/AppI18nProvider.component'
import { withCopy } from '@/test/intl.helper'

const messages = {
  components: { modal: { close: 'Close' } }
}

const renderModal = (
  props: Partial<React.ComponentProps<typeof Modal>> = {}
) =>
  render(
    <AppI18nProvider locale="en" messages={withCopy({ copy: messages })}>
      <Modal isOpen={true} onClose={vi.fn()} {...props} />
    </AppI18nProvider>
  )

describe('Modal', () => {
  test('renders children when open', () => {
    renderModal({ children: <p>Modal content</p> })
    expect(screen.getByText('Modal content')).toBeTruthy()
  })

  test('returns null when closed', () => {
    const { container } = render(
      <AppI18nProvider locale="en" messages={withCopy({ copy: messages })}>
        <Modal isOpen={false} onClose={vi.fn()}>
          content
        </Modal>
      </AppI18nProvider>
    )
    expect(container.firstChild).toBeNull()
  })

  test('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  test('calls onClose when scrim is clicked', () => {
    const onClose = vi.fn()
    renderModal({ children: <p>body</p>, onClose })
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  test('renders title when provided', () => {
    renderModal({ children: <p>body</p>, title: 'My Title' })
    expect(screen.getByRole('heading', { name: 'My Title' })).toBeTruthy()
  })

  test('has role=dialog and aria-modal', () => {
    renderModal({ children: <p>body</p> })
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })
})
