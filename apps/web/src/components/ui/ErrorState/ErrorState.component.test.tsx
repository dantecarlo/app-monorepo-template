import { fireEvent, render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test, vi } from 'vitest'

import { ErrorState } from '@/components/ui/ErrorState/ErrorState.component'
import { ErrorStateCodeEnum } from '@/components/ui/ErrorState/ErrorState.constant'

const messages = {
  components: {
    errorState: {
      byCode: {
        '403': {
          message: 'Access denied message',
          title: 'Access denied'
        },
        '404': { message: 'Not found message', title: 'Not found' },
        '500': { message: 'Server error message', title: 'Server error' },
        offline: {
          message: 'Offline message',
          title: 'No connection'
        }
      },
      message: 'Something went wrong.',
      retry: 'Try again',
      title: 'An error occurred'
    }
  }
}

const renderErrorState = (
  props: Partial<React.ComponentProps<typeof ErrorState>> = {}
) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ErrorState {...props} />
    </NextIntlClientProvider>
  )

describe('ErrorState', () => {
  test('renders generic copy when no code', () => {
    renderErrorState()
    expect(screen.getByText('An error occurred')).toBeTruthy()
    expect(screen.getByText('Something went wrong.')).toBeTruthy()
  })

  test('renders code-specific copy for 404', () => {
    renderErrorState({ code: ErrorStateCodeEnum.NotFound })
    expect(screen.getByText('Not found')).toBeTruthy()
  })

  test('renders retry button and calls onRetry', () => {
    const onRetry = vi.fn()
    renderErrorState({ onRetry })
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  test('calls resetErrorBoundary as fallback retry', () => {
    const resetErrorBoundary = vi.fn()
    renderErrorState({ resetErrorBoundary })
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(resetErrorBoundary).toHaveBeenCalledOnce()
  })

  test('does not render retry button when neither onRetry nor resetErrorBoundary given', () => {
    renderErrorState()
    expect(screen.queryByRole('button')).toBeNull()
  })

  test('has role=alert', () => {
    renderErrorState()
    expect(screen.getByRole('alert')).toBeTruthy()
  })
})
