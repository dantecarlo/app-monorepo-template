import { afterEach, describe, expect, test } from 'vitest'
import { axe } from 'vitest-axe'

import { useToastStore } from '@/stores/toast.store'
import { act, render, screen } from '@/test/test.helper'

import { Toast } from './Toast.component'

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
    render(<Toast />)
    expect(screen.getByText('Saved successfully')).toBeInTheDocument()
  })

  test('has no accessibility violations', async () => {
    seed('Saved successfully')
    const { container } = render(<Toast />)
    expect(await axe(container)).toHaveNoViolations()
  })

  test('renders an empty live region when there are no toasts', () => {
    resetStore()
    render(<Toast />)
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  test('removes a toast when its dismiss button is pressed', () => {
    seed('Saved successfully')
    render(<Toast />)
    act(() => {
      screen.getByRole('button', { name: 'Dismiss' }).click()
    })
    expect(
      screen.queryByText('Saved successfully')
    ).not.toBeInTheDocument()
  })
})
