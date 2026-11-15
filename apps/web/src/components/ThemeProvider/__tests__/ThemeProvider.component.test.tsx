import { ThemeEnum } from '@app/tokens'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, test } from 'vitest'

import { ThemeProvider } from '@/components/ThemeProvider/ThemeProvider.component'
import { THEME_ATTRIBUTE } from '@/lib/theme/theme.constant'
import { useThemeStore } from '@/stores/theme.store'

describe('ThemeProvider', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: ThemeEnum.DARK })
  })

  test('renders children', () => {
    const { getByText } = render(
      <ThemeProvider>
        <span>child</span>
      </ThemeProvider>
    )

    expect(getByText('child')).toBeDefined()
  })

  test('adopts the painted theme attribute into the store on mount', () => {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, ThemeEnum.LIGHT)

    const { unmount } = render(
      <ThemeProvider>
        <div />
      </ThemeProvider>
    )

    expect(useThemeStore.getState().theme).toBe(ThemeEnum.LIGHT)
    unmount()
  })
})
