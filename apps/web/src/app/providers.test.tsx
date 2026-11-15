import type { IAuthGateway } from '@app/core'
import { DEFAULT_LANGUAGE, resources } from '@app/i18n'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { Providers } from '@/app/providers'
import { useToastStore } from '@/stores/toast.store'
import { act, fireEvent, render, screen } from '@/test/test.helper'

const makeGateway = (): IAuthGateway => ({
  getSession: vi.fn().mockResolvedValue(null),
  onAuthStateChange: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  signIn: vi.fn(),
  signOut: vi.fn()
})

describe('Providers', () => {
  afterEach(() => {
    useToastStore.getState().clear()
  })

  test('shows a queued error toast and removes it when Dismiss is pressed', () => {
    render(
      <Providers
        gateway={makeGateway()}
        messages={resources[DEFAULT_LANGUAGE].translation}
      >
        <p>Page</p>
      </Providers>
    )

    act(() => {
      useToastStore
        .getState()
        .add({ message: 'Could not save the item', variant: 'error' })
    })
    expect(screen.getByRole('status')).toHaveTextContent(
      'Could not save the item'
    )

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(
      screen.queryByText('Could not save the item')
    ).not.toBeInTheDocument()
  })
})
