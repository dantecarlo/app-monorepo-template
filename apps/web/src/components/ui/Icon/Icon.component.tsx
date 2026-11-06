import type { JSX } from 'react'

import {
  DEFAULT_ICON_SIZE,
  ICON_PATHS,
  STROKE_WIDTH
} from '@/components/ui/Icon/Icon.constant'
import type { IIconProps } from '@/components/ui/Icon/Icon.type'

export type { IconNameType } from '@/components/ui/Icon/Icon.constant'

export const Icon = ({
  color = 'currentColor',
  decorative = true,
  label,
  name,
  size = DEFAULT_ICON_SIZE
}: IIconProps): JSX.Element => {
  const path = ICON_PATHS[name]
  const a11yProps = decorative
    ? { 'aria-hidden': true as const }
    : { 'aria-label': label, role: 'img' as const }

  return (
    <svg
      fill="none"
      height={size}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={STROKE_WIDTH}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...a11yProps}
    >
      <path d={path} />
    </svg>
  )
}
