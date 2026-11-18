import { themeVars } from '@app/tokens'
import { colorScheme } from 'nativewind'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { useToastStore } from '@/stores/toast.store'
import { act, render, screen, within } from '@/test/test.helper'

const { mockHoldSplashScreen, mockUseAppBootstrap } = vi.hoisted(() => ({
  mockHoldSplashScreen: vi.fn(),
  mockUseAppBootstrap: vi.fn(() => ({ isReady: true }))
}))

vi.mock('expo-router', () => ({ Stack: () => 'routes' }))
vi.mock('@/components/ui/StatusBar', () => ({ StatusBar: () => null }))
// The splash screen and the fonts act only in a native or web build: the
// root layout reaches both through lib/bootstrap, which the test replaces.
vi.mock('@/lib/bootstrap/splashScreen.adapter', () => ({
  hideSplashScreen: vi.fn(),
  holdSplashScreen: mockHoldSplashScreen
}))
vi.mock('@/lib/bootstrap/useAppBootstrap.hook', () => ({
  useAppBootstrap: mockUseAppBootstrap
}))
vi.mock('@/lib/supabase/client.adapter', () => ({ supabase: {} }))
// The root layout binds observability to PostHog, whose package cannot load
// under the test environment.
vi.mock('posthog-react-native', () => ({ PostHog: class {} }))
vi.mock('@app/supabase', () => ({
  createSupabaseAuthGateway: () => ({
    getSession: vi.fn().mockResolvedValue(null),
    onAuthStateChange: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    signIn: vi.fn(),
    signOut: vi.fn()
  })
}))

import RootLayout, { ErrorBoundary } from '@/app/_layout'
import { RootErrorBoundary } from '@/components/RootErrorBoundary'

describe('RootLayout', () => {
  afterEach(() => {
    useToastStore.getState().clear()
    colorScheme.set('dark')
  })

  test('shows a toast added to the store over the routes', () => {
    render(<RootLayout />)

    act(() => {
      useToastStore
        .getState()
        .add({ message: 'Could not save the item', variant: 'error' })
    })

    expect(
      within(screen.getByRole('alert')).getByText(
        'Could not save the item'
      )
    ).toBeTruthy()
  })

  test('holds the splash screen through lib/bootstrap as it loads', () => {
    expect(mockHoldSplashScreen).toHaveBeenCalledOnce()
  })

  test('renders no route until the bootstrap is ready', () => {
    mockUseAppBootstrap.mockReturnValueOnce({ isReady: false })

    render(<RootLayout />)

    expect(screen.queryByText('routes')).toBeNull()
  })

  test('exports the root error boundary as its ErrorBoundary', () => {
    expect(ErrorBoundary).toBe(RootErrorBoundary)
  })

  test('wraps the routes in the variables of the active theme', () => {
    colorScheme.set('light')
    render(<RootLayout />)

    const frame = (
      screen.getByText('routes') as unknown as {
        getAttribute: (name: string) => string | null
      }
    ).getAttribute('data-style')

    expect(JSON.parse(frame ?? '{}')).toEqual({
      ...themeVars.light,
      flex: 1
    })
  })
})
