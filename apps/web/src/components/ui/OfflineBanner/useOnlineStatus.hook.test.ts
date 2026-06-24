import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { useOnlineStatus } from './useOnlineStatus.hook'

describe('useOnlineStatus', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
      writable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('defaults to true (online)', () => {
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(true)
  })

  test('reflects navigator.onLine false when offline event fires', () => {
    const { result } = renderHook(() => useOnlineStatus())

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: false,
        writable: true
      })
      window.dispatchEvent(new Event('offline'))
    })

    expect(result.current).toBe(false)
  })

  test('returns true when online event fires after being offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false,
      writable: true
    })
    const { result } = renderHook(() => useOnlineStatus())

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: true,
        writable: true
      })
      window.dispatchEvent(new Event('online'))
    })

    expect(result.current).toBe(true)
  })
})
