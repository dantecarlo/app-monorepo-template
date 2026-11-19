import { beforeEach, describe, expect, test, vi } from 'vitest'

import { renderHook } from '@/test/test.helper'

// What the font loader reports, [loaded, error], as expo-font's useFonts
// returns it; each test sets the state the fonts are in.
type FontStateType = [boolean, Error | null]

const { mockHideSplashScreen, mockUseFonts } = vi.hoisted(() => ({
  mockHideSplashScreen: vi.fn(),
  mockUseFonts: vi.fn<(fonts: Record<string, string>) => FontStateType>()
}))

vi.mock('@expo-google-fonts/montserrat', () => ({
  useFonts: mockUseFonts
}))
// The font files load only in a native or web build; their map is the
// constant's own test.
vi.mock('@/lib/bootstrap/useAppBootstrap.constant', () => ({
  APP_FONTS: { Inter_400Regular: 'Inter_400Regular' }
}))
vi.mock('@/lib/bootstrap/splashScreen.adapter', () => ({
  hideSplashScreen: mockHideSplashScreen,
  holdSplashScreen: vi.fn()
}))

import { APP_FONTS } from '@/lib/bootstrap/useAppBootstrap.constant'
import { useAppBootstrap } from '@/lib/bootstrap/useAppBootstrap.hook'

describe('useAppBootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('loads the faces the app renders its text in', () => {
    mockUseFonts.mockReturnValue([true, null])

    renderHook(() => useAppBootstrap())

    expect(mockUseFonts).toHaveBeenCalledWith(APP_FONTS)
  })

  test('keeps the splash screen up and the routes back while the fonts load', () => {
    mockUseFonts.mockReturnValue([false, null])

    const { result } = renderHook(() => useAppBootstrap())

    expect(result.current).toEqual({ isReady: false })
    expect(mockHideSplashScreen).not.toHaveBeenCalled()
  })

  test('hides the splash screen and lets the routes render once the fonts load', () => {
    mockUseFonts.mockReturnValue([false, null])
    const { rerender, result } = renderHook(() => useAppBootstrap())

    mockUseFonts.mockReturnValue([true, null])
    rerender()

    expect(result.current).toEqual({ isReady: true })
    expect(mockHideSplashScreen).toHaveBeenCalledOnce()
  })

  test('hides the splash screen and lets the routes render when a font fails to load', () => {
    mockUseFonts.mockReturnValue([false, new Error('font failed')])

    const { result } = renderHook(() => useAppBootstrap())

    expect(result.current).toEqual({ isReady: true })
    expect(mockHideSplashScreen).toHaveBeenCalledOnce()
  })
})
