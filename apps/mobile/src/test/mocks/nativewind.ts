// Test mock for NativeWind. The real package ships untransformed TS that the
// vitest transformer cannot parse; tests only need the color-scheme surface.
// Defaults to the dark scheme so theme-aware components render the dark canon.

let currentScheme: 'dark' | 'light' = 'dark'

const noop = () => undefined

export const colorScheme = {
  get: () => currentScheme,
  set: (scheme: 'dark' | 'light') => {
    currentScheme = scheme
  },
  toggle: noop
}

export const useColorScheme = () => ({
  colorScheme: currentScheme,
  setColorScheme: (scheme: 'dark' | 'light') => {
    currentScheme = scheme
  },
  toggleColorScheme: noop
})
