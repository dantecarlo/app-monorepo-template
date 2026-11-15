import { colors } from '@app/tokens'
import { View } from 'react-native'

import { SCREEN_STYLES as styles } from '@/components/ui/Screen/Screen.style'
import type { IScreenProps } from '@/components/ui/Screen/Screen.type'
import { useRootTheme } from '@/lib/theme/useRootTheme.hook'

// The surface a screen renders on: it fills its parent and paints the dark
// base, or the active theme's base when themed.
export const Screen = ({
  children,
  style,
  themed = false
}: IScreenProps) => {
  const { contentBackgroundColor } = useRootTheme()

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: themed ? contentBackgroundColor : colors.bg.base
        },
        style
      ]}
    >
      {children}
    </View>
  )
}
