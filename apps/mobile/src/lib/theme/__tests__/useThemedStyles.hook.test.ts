import { colorScheme } from 'nativewind'
import { afterEach, describe, expect, test } from 'vitest'

import { useThemedStyles } from '@/lib/theme/useThemedStyles.hook'
import { renderHook } from '@/test/test.helper'

const STYLES = {
  dark: { root: { backgroundColor: 'dark-base' } },
  light: { root: { backgroundColor: 'light-base' } }
}

describe('useThemedStyles', () => {
  afterEach(() => {
    colorScheme.set('dark')
  })

  test('returns the sheet of the active theme', () => {
    const { rerender, result } = renderHook(() =>
      useThemedStyles({ styles: STYLES })
    )
    expect(result.current).toBe(STYLES.dark)

    colorScheme.set('light')
    rerender()

    expect(result.current).toBe(STYLES.light)
  })
})
