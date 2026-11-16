import { Platform } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import {
  DEFAULT_ICON_SIZE,
  ICON_PATHS,
  STROKE_WIDTH
} from '@/components/ui/Icon/Icon.constant'
import type { IIconProps } from '@/components/ui/Icon/Icon.type'
import { useThemeTokens } from '@/lib/theme/useThemeTokens.hook'

export type { IconNameType } from '@/components/ui/Icon/Icon.constant'

export const Icon = ({
  color,
  decorative = true,
  label,
  name,
  size = DEFAULT_ICON_SIZE
}: IIconProps) => {
  const { colors: palette } = useThemeTokens()
  const path = ICON_PATHS[name]

  const a11yProps =
    Platform.OS === 'ios' || Platform.OS === 'android'
      ? decorative
        ? { accessible: false }
        : {
            accessibilityLabel: label,
            accessibilityRole: 'image' as const,
            accessible: true
          }
      : {}

  return (
    <Svg
      fill="none"
      height={size}
      stroke={color ?? palette.text.primary}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={STROKE_WIDTH}
      viewBox="0 0 24 24"
      width={size}
      {...a11yProps}
    >
      <Path d={path} />
    </Svg>
  )
}
