import { fireEvent, render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test, vi } from 'vitest'

import { Modal } from '@/components/ui/Modal/Modal.component'

const messages = {
  components: { modal: { close: 'Close' } }
}

const renderModal = (
  props: Partial<React.ComponentProps<typeof Modal>> = {}
) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <Modal isOpen={true} onClose={vi.fn()} {...props} />
    </NextIntlClientProvider>
  )

describe('Modal', () => {
  test('renders children when open', () => {
    renderModal({ children: <p>Modal content</p> })
    expect(screen.getByText('Modal content')).toBeTruthy()
  })

  test('returns null when closed', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Modal isOpen={false} onClose={vi.fn()}>
          content
        </Modal>
      </NextIntlClientProvider>
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
