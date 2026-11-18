import type { ReactNode } from 'react'
import { describe, expect, test, vi } from 'vitest'

import { render, screen } from '@/test/test.helper'

// The device's safe-area provider, recorded, so the test reads that the
// block renders its tree inside it.
const { mockSafeAreaProvider } = vi.hoisted(() => ({
  mockSafeAreaProvider: vi.fn(
    ({ children }: { children?: ReactNode }) => children
  )
}))

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: mockSafeAreaProvider
}))

import { AppSafeAreaProvider } from '@/lib/bootstrap/AppSafeAreaProvider.component'

describe('AppSafeAreaProvider', () => {
  test("renders its tree inside the device's safe-area provider", () => {
    render(<AppSafeAreaProvider>routes</AppSafeAreaProvider>)

    expect(screen.getByText('routes')).toBeTruthy()
    expect(mockSafeAreaProvider).toHaveBeenCalledOnce()
    expect(mockSafeAreaProvider.mock.calls[0]?.[0]).toEqual({
      children: 'routes'
    })
  })
})
