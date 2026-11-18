import '../../global.css'
import '@/lib/i18n/i18n.config'
import '@/lib/theme/theme.config'

import { createSupabaseAuthGateway } from '@app/supabase'
import { Stack } from 'expo-router'
import { View } from 'react-native'

import { AuthProvider } from '@/components/AuthProvider'
import { StatusBar } from '@/components/ui/StatusBar'
import { Toast } from '@/components/ui/Toast'
import { AppSafeAreaProvider } from '@/lib/bootstrap/AppSafeAreaProvider.component'
import { holdSplashScreen } from '@/lib/bootstrap/splashScreen.adapter'
import { useAppBootstrap } from '@/lib/bootstrap/useAppBootstrap.hook'
import { observability } from '@/lib/observability/observability.adapter'
import { toCaptureError } from '@/lib/observability/toCaptureError.helper'
import { AppQueryProvider } from '@/lib/query/AppQueryProvider.component'
import { createQueryClient } from '@/lib/query/createQueryClient.helper'
import { supabase } from '@/lib/supabase/client.adapter'
import { useRootTheme } from '@/lib/theme/useRootTheme.hook'

// Expo Router wraps the root layout, and every route below it, in this boundary.
export { RootErrorBoundary as ErrorBoundary } from '@/components/RootErrorBoundary'

holdSplashScreen()

const queryClient = createQueryClient({
  onCaptureError: toCaptureError({ observability })
})
const authGateway = createSupabaseAuthGateway({ client: supabase })

const RootLayout = () => {
  const { contentStyle, statusBarStyle, themeStyle } = useRootTheme()
  const { isReady } = useAppBootstrap()

  if (!isReady) {
    return null
  }

  return (
    <AppSafeAreaProvider>
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
    </AppSafeAreaProvider>
  )
}

export default RootLayout
