import { StatusBar as ExpoStatusBar } from 'expo-status-bar'

import type { IStatusBarProps } from '@/components/ui/StatusBar/StatusBar.type'

// The system status bar, with the glyph style it is given. The status bar
// library stays in this block, so the root layout renders this one.
export const StatusBar = ({ style }: IStatusBarProps) => (
  <ExpoStatusBar style={style} />
)
