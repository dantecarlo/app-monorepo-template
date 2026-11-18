import { beforeEach, describe, expect, test, vi } from 'vitest'

// The native splash screen exists only in a native or web build, so the
// test reads what the adapter asks of it.
const { mockHideAsync, mockPreventAutoHideAsync } = vi.hoisted(() => ({
  mockHideAsync: vi.fn(),
  mockPreventAutoHideAsync: vi.fn()
}))

vi.mock('expo-splash-screen', () => ({
  hideAsync: mockHideAsync,
  preventAutoHideAsync: mockPreventAutoHideAsync
}))

import {
  hideSplashScreen,
  holdSplashScreen
} from '@/lib/bootstrap/splashScreen.adapter'

describe('splashScreen adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('keeps the native splash screen up until it is hidden', () => {
    holdSplashScreen()

    expect(mockPreventAutoHideAsync).toHaveBeenCalledOnce()
    expect(mockHideAsync).not.toHaveBeenCalled()
  })

  test('hides the native splash screen', () => {
    hideSplashScreen()

    expect(mockHideAsync).toHaveBeenCalledOnce()
    expect(mockPreventAutoHideAsync).not.toHaveBeenCalled()
  })
})
