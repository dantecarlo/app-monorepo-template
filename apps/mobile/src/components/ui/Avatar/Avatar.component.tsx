import { fontFamily } from '@app/tokens'
import { Text, View } from 'react-native'

import {
  AVATAR_DEFAULT_SIZE,
  AVATAR_FONT_SIZES
} from '@/components/ui/Avatar/Avatar.constant'
import {
  AVATAR_BORDER_RADIUS,
  AVATAR_VARIANT_COLORS
} from '@/components/ui/Avatar/Avatar.style'
import type { IAvatarProps } from '@/components/ui/Avatar/Avatar.type'

export const Avatar = ({
  initials,
  size = AVATAR_DEFAULT_SIZE,
  variant = 'neutral'
}: IAvatarProps) => {
  const { backgroundColor, textColor } = AVATAR_VARIANT_COLORS[variant]
  const fontSize = AVATAR_FONT_SIZES[size]
  const borderRadius = AVATAR_BORDER_RADIUS[size]

  return (
    <View
      accessible={false}
      style={{
        alignItems: 'center',
        backgroundColor,
        borderRadius,
        height: size,
        justifyContent: 'center',
        width: size
      }}
    >
      <Text
        style={{
          color: textColor,
          fontFamily: fontFamily.body,
          fontSize,
          fontWeight: '600'
        }}
      >
        {initials}
      </Text>
    </View>
  )
}
