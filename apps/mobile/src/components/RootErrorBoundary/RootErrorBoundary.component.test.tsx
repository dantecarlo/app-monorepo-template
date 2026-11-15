import { describe, expect, test, vi } from 'vitest'

import { fireEvent, render, screen, within } from '@/test/test.helper'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

import { RootErrorBoundary } from './RootErrorBoundary.component'

describe('RootErrorBoundary', () => {
  test('renders the generic error state for a render crash', () => {
    render(
      <RootErrorBoundary
        error={new Error('render failed')}
        retry={vi.fn().mockResolvedValue(undefined)}
      />
    )

    const alert = within(screen.getByRole('alert'))
    expect(alert.getByText('components.errorState.title')).toBeTruthy()
    expect(alert.getByText('components.errorState.message')).toBeTruthy()
  })

  test('calls retry when the retry control is pressed', () => {
    const retry = vi.fn().mockResolvedValue(undefined)
    render(
      <RootErrorBoundary
        error={new Error('render failed')}
        retry={retry}
      />
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'components.errorState.retry' })
    )

    expect(retry).toHaveBeenCalledOnce()
  })
})
