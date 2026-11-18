import { describe, expect, expectTypeOf, test, vi } from 'vitest'

// Next's router, with the methods the app's router leaves out as well.
const { nextRouter } = vi.hoisted(() => ({
  nextRouter: {
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn()
  }
}))

vi.mock('next/navigation', () => ({
  useRouter: () => nextRouter
}))

import { type IAppRouter, useAppRouter } from '@/lib/routing'
import { renderHook } from '@/test/test.helper'

describe('useAppRouter', () => {
  test('pushes and replaces a route and refreshes the current one through the Next router', () => {
    const { result } = renderHook(() => useAppRouter())

    result.current.push('/login')
    result.current.replace('/')
    result.current.refresh()

    expect(nextRouter.push).toHaveBeenCalledExactlyOnceWith('/login')
    expect(nextRouter.replace).toHaveBeenCalledExactlyOnceWith('/')
    expect(nextRouter.refresh).toHaveBeenCalledExactlyOnceWith()
    expect(nextRouter.prefetch).not.toHaveBeenCalled()
  })

  test('exposes only push, refresh and replace, typed by the app', () => {
    const { result } = renderHook(() => useAppRouter())

    expect(Object.keys(result.current).sort()).toEqual([
      'push',
      'refresh',
      'replace'
    ])
    expectTypeOf(result.current).toEqualTypeOf<IAppRouter>()
    expectTypeOf<keyof IAppRouter>().toEqualTypeOf<
      'push' | 'refresh' | 'replace'
    >()
  })

  test('returns the same router across renders', () => {
    const { rerender, result } = renderHook(() => useAppRouter())
    const first = result.current

    rerender()

    expect(result.current).toBe(first)
  })
})
