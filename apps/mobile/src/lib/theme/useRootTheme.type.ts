import type { StatusBarStyle } from 'expo-status-bar'
import type { StyleProp, ViewStyle } from 'react-native'

export interface IUseRootThemeResult {
  contentBackgroundColor: string
  contentStyle: ViewStyle
  statusBarStyle: StatusBarStyle
  /** The root frame: full size, carrying the active theme's variables. */
  themeStyle: StyleProp<ViewStyle>
}
