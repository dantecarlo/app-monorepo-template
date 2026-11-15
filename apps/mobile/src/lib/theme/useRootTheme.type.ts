import type { StatusBarStyle } from 'expo-status-bar'
import type { ViewStyle } from 'react-native'

export interface IUseRootThemeResult {
  contentBackgroundColor: string
  contentStyle: ViewStyle
  statusBarStyle: StatusBarStyle
}
