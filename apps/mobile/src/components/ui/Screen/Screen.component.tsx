import { View } from 'react-native'

import { SCREEN_STYLES as styles } from '@/components/ui/Screen/Screen.style'
import type { IScreenProps } from '@/components/ui/Screen/Screen.type'
import { useRootTheme } from '@/lib/theme/useRootTheme.hook'

// The surface a screen renders on: it fills its parent and paints the active
// theme's base.
export const Screen = ({ children, style }: IScreenProps) => {
  const { contentBackgroundColor } = useRootTheme()

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: contentBackgroundColor },
        style
      ]}
    >
      {children}
    </View>
  )
}
