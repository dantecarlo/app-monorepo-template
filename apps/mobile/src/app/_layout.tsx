import '../../global.css'
import '@/lib/i18n/i18n.config'

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

import { createQueryClient } from '@/lib/query/createQueryClient.helper'

SplashScreen.preventAutoHideAsync()

const queryClient = createQueryClient()

const RootLayout = () => {
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
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            animation: 'fade',
            contentStyle: { backgroundColor: '#0A0B0D' },
            headerShown: false
          }}
        />
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}

export default RootLayout
