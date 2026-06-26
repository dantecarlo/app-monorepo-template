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
import { QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AuthProvider } from '@/components/AuthProvider'
import { observability } from '@/lib/observability/observability.adapter'
import { toCaptureError } from '@/lib/observability/toCaptureError.helper'
import { createQueryClient } from '@/lib/query/createQueryClient.helper'
import { supabase } from '@/lib/supabase/client.adapter'
import { useRootTheme } from '@/lib/theme/useRootTheme.hook'

SplashScreen.preventAutoHideAsync()

const queryClient = createQueryClient({
  onCaptureError: toCaptureError({ observability })
})
const authGateway = createSupabaseAuthGateway({ client: supabase })

const RootLayout = () => {
  const { contentBackgroundColor, statusBarStyle } = useRootTheme()
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
      <QueryClientProvider client={queryClient}>
        <AuthProvider gateway={authGateway}>
          <StatusBar style={statusBarStyle} />
          <Stack
            screenOptions={{
              animation: 'fade',
              contentStyle: { backgroundColor: contentBackgroundColor },
              headerShown: false
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}

export default RootLayout
