import * as SplashScreen from 'expo-splash-screen'

/**
 * Keeps the native splash screen up past the first frame, until
 * hideSplashScreen runs. The root layout calls it as its module loads,
 * before any route renders.
 */
export const holdSplashScreen = (): void => {
  SplashScreen.preventAutoHideAsync()
}

/** Hides the native splash screen; useAppBootstrap calls it once the fonts settle. */
export const hideSplashScreen = (): void => {
  SplashScreen.hideAsync()
}
