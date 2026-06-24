import { colors } from '@app/tokens'
import { Platform } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import {
  DEFAULT_ICON_SIZE,
  ICON_PATHS,
  STROKE_WIDTH
} from '@/components/ui/Icon/Icon.constant'

export type { IconNameType } from '@/components/ui/Icon/Icon.constant'

export interface IIconProps {
  color?: string
  decorative?: boolean
  label?: string
  name: keyof typeof ICON_PATHS
  size?: number
}

export const Icon = ({
  color = colors.text.primary,
  decorative = true,
  label,
  name,
  size = DEFAULT_ICON_SIZE
}: IIconProps) => {
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
      stroke={color}
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
