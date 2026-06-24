import type { JSX } from 'react'

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
