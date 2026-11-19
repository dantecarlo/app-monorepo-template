import type { JSX } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import type { IAppSafeAreaProviderProps } from '@/lib/bootstrap/AppSafeAreaProvider.type'

/**
 * The device's safe area for every block below it, which ui/AuthShell reads
 * its insets from: the one place the root's tree meets the safe-area
 * library's provider.
 */
export const AppSafeAreaProvider = ({
  children
}: IAppSafeAreaProviderProps): JSX.Element => (
  <SafeAreaProvider>{children}</SafeAreaProvider>
)
