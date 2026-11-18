import '../../global.css'
import '@/lib/i18n/i18n.config'
import '@/lib/theme/theme.config'

import { createSupabaseAuthGateway } from '@app/supabase'
import {
  Inter_400Regular,
  Inter_500Medium
} from '@expo-google-fonts/inter'
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  useFonts
} from '@expo-google-fonts/montserrat'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AuthProvider } from '@/components/AuthProvider'
import { StatusBar } from '@/components/ui/StatusBar'
import { Toast } from '@/components/ui/Toast'
import { observability } from '@/lib/observability/observability.adapter'
import { toCaptureError } from '@/lib/observability/toCaptureError.helper'
import { AppQueryProvider } from '@/lib/query/AppQueryProvider.component'
import { createQueryClient } from '@/lib/query/createQueryClient.helper'
import { supabase } from '@/lib/supabase/client.adapter'
import { useRootTheme } from '@/lib/theme/useRootTheme.hook'

// Expo Router wraps the root layout, and every route below it, in this boundary.
export { RootErrorBoundary as ErrorBoundary } from '@/components/RootErrorBoundary'

SplashScreen.preventAutoHideAsync()

const queryClient = createQueryClient({
  onCaptureError: toCaptureError({ observability })
})
const authGateway = createSupabaseAuthGateway({ client: supabase })

const RootLayout = () => {
  const { contentStyle, statusBarStyle, themeStyle } = useRootTheme()
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold
  })

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <SafeAreaProvider>
      <AppQueryProvider client={queryClient}>
        <AuthProvider gateway={authGateway}>
          <View style={themeStyle}>
            <StatusBar style={statusBarStyle} />
            <Stack
              screenOptions={{
                animation: 'fade',
                contentStyle,
                headerShown: false
              }}
            />
            <Toast />
          </View>
        </AuthProvider>
      </AppQueryProvider>
    </SafeAreaProvider>
  )
}

export default RootLayout
