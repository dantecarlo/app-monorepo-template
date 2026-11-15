import { DEFAULT_LANGUAGE, resources } from '@app/i18n'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test, vi } from 'vitest'

import RouteError from '@/app/error'
import { fireEvent, render, screen } from '@/test/test.helper'

const messages = resources[DEFAULT_LANGUAGE].translation
const errorStateCopy = messages.components.errorState

const renderRouteError = ({ retry }: { retry: () => void }) =>
  render(
    <NextIntlClientProvider locale={DEFAULT_LANGUAGE} messages={messages}>
      <RouteError
        error={new Error('render failed')}
        reset={vi.fn()}
        unstable_retry={retry}
      />
    </NextIntlClientProvider>
  )

describe('RouteError', () => {
  test('renders the generic error state for a render crash', () => {
    renderRouteError({ retry: vi.fn() })

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(errorStateCopy.title)
    expect(alert).toHaveTextContent(errorStateCopy.message)
  })

  test('retries the segment when Try again is pressed', () => {
    const retry = vi.fn()
    renderRouteError({ retry })

    fireEvent.click(
      screen.getByRole('button', { name: errorStateCopy.retry })
    )

    expect(retry).toHaveBeenCalledOnce()
  })
})
