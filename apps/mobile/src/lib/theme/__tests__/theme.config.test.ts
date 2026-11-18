import { createMemoryKeyValueStorage } from '@app/core'
import { ThemeEnum } from '@app/tokens'
import { afterEach, expect, test, vi } from 'vitest'

const THEME_KEY = 'app.theme'

interface ILoadParams {
  /** What the device's appearance reports: the mock's dark by default. */
  appearance?: 'dark' | 'light' | null
  /** The theme an earlier session stored, if any. */
  stored?: string
}

// A fresh launch: the project module that owns the device storage is
// replaced by the in-memory storage of @app/core, and the theme config,
// whose import starts the bootstrap, is loaded on it.
const launch = async ({ appearance, stored }: ILoadParams = {}) => {
  vi.resetModules()
  const device = createMemoryKeyValueStorage()
  if (stored !== undefined) {
    await device.setItem({ key: THEME_KEY, value: stored })
  }
  vi.doMock('@/lib/storage', () => ({ keyValueStorage: device }))
  const { colorScheme } = await import('nativewind')
  const { Appearance } = await import('react-native')
  if (appearance !== undefined) {
    vi.spyOn(Appearance, 'getColorScheme').mockReturnValue(appearance)
  }
  vi.spyOn(colorScheme, 'set')
  const config = await import('@/lib/theme/theme.config')
  await vi.waitFor(() => expect(colorScheme.set).toHaveBeenCalledOnce())
  return { colorScheme, config, device }
}

afterEach(() => {
  vi.doUnmock('@/lib/storage')
  vi.doUnmock('@/lib/theme/colorScheme.adapter')
  vi.restoreAllMocks()
})

test('starts in the theme the device storage holds', async () => {
  const { colorScheme } = await launch({
    appearance: ThemeEnum.DARK,
    stored: ThemeEnum.LIGHT
  })

  expect(colorScheme.set).toHaveBeenCalledWith(ThemeEnum.LIGHT)
  expect(colorScheme.get()).toBe(ThemeEnum.LIGHT)
})

test('starts in the dark default when nothing is stored and the device has no appearance', async () => {
  const { colorScheme } = await launch({ appearance: null })

  expect(colorScheme.set).toHaveBeenCalledWith(ThemeEnum.DARK)
  expect(colorScheme.get()).toBe(ThemeEnum.DARK)
})

test('stores a chosen theme in the device storage and applies it', async () => {
  const { colorScheme, config, device } = await launch()

  await config.setTheme(ThemeEnum.LIGHT)

  expect(await device.getItem({ key: THEME_KEY })).toBe(ThemeEnum.LIGHT)
  expect(colorScheme.get()).toBe(ThemeEnum.LIGHT)
})

test('applies the start-up theme and a chosen one through applyTheme', async () => {
  const applyTheme = vi.fn()
  vi.doMock('@/lib/theme/colorScheme.adapter', async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('@/lib/theme/colorScheme.adapter')
      >()
    applyTheme.mockImplementation(actual.applyTheme)
    return { applyTheme }
  })
  const { config } = await launch({ stored: ThemeEnum.LIGHT })

  await config.setTheme(ThemeEnum.DARK)

  expect(applyTheme.mock.calls).toEqual([
    [{ theme: ThemeEnum.LIGHT }],
    [{ theme: ThemeEnum.DARK }]
  ])
})
