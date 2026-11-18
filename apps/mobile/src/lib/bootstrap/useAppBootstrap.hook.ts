import { useFonts } from '@expo-google-fonts/montserrat'
import { useEffect } from 'react'

import { hideSplashScreen } from '@/lib/bootstrap/splashScreen.adapter'
import { APP_FONTS } from '@/lib/bootstrap/useAppBootstrap.constant'
import type { IUseAppBootstrapResult } from '@/lib/bootstrap/useAppBootstrap.type'

/**
 * What the root layout boots with: loads the app's fonts and hides the
 * splash screen once they have loaded or failed to load, so no route paints
 * in a font that is about to change. A failed font settles too: the routes
 * render in the fallback font rather than never.
 */
export const useAppBootstrap = (): IUseAppBootstrapResult => {
  const [fontsLoaded, fontError] = useFonts(APP_FONTS)
  const isReady = fontsLoaded || Boolean(fontError)

  useEffect(() => {
    if (isReady) {
      hideSplashScreen()
    }
  }, [isReady])

  return { isReady }
}
