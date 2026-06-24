import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import {
  selectAddToast,
  selectRemoveToast,
  selectToasts,
  useToastStore
} from './toast.store'

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('toast.store', () => {
  test('starts with an empty toasts list', () => {
    expect(selectToasts(useToastStore.getState())).toHaveLength(0)
  })

  test('add appends a toast with an auto-generated id', () => {
    selectAddToast(useToastStore.getState())({
      message: 'Hello',
      variant: 'success'
    })
    const toasts = selectToasts(useToastStore.getState())
    expect(toasts).toHaveLength(1)
    expect(toasts[0]!.message).toBe('Hello')
    expect(toasts[0]!.variant).toBe('success')
    expect(typeof toasts[0]!.id).toBe('string')
  })

  test('remove removes a toast by id', () => {
    selectAddToast(useToastStore.getState())({
      message: 'A',
      variant: 'info'
    })
    const id = selectToasts(useToastStore.getState())[0]!.id
    selectRemoveToast(useToastStore.getState())(id)
    expect(selectToasts(useToastStore.getState())).toHaveLength(0)
  })

  test('clear removes all toasts', () => {
    selectAddToast(useToastStore.getState())({
      message: 'A',
      variant: 'info'
    })
    selectAddToast(useToastStore.getState())({
      message: 'B',
      variant: 'error'
    })
    useToastStore.getState().clear()
    expect(selectToasts(useToastStore.getState())).toHaveLength(0)
  })

  test('toast auto-dismisses after 4 seconds', () => {
    selectAddToast(useToastStore.getState())({
      message: 'Auto',
      variant: 'info'
    })
    expect(selectToasts(useToastStore.getState())).toHaveLength(1)
    vi.advanceTimersByTime(4000)
    expect(selectToasts(useToastStore.getState())).toHaveLength(0)
  })
})
