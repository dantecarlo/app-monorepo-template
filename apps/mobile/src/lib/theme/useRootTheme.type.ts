import type { StyleProp, ViewStyle } from 'react-native'

import type { StatusBarStyleType } from '@/components/ui/StatusBar'

export interface IUseRootThemeResult {
  contentBackgroundColor: string
  contentStyle: ViewStyle
  statusBarStyle: StatusBarStyleType
  /** The root frame: full size, carrying the active theme's variables. */
  themeStyle: StyleProp<ViewStyle>
}
