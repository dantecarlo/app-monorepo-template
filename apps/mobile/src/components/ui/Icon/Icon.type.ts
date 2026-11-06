import { ICON_PATHS } from '@/components/ui/Icon/Icon.constant'

export interface IIconProps {
  color?: string
  decorative?: boolean
  label?: string
  name: keyof typeof ICON_PATHS
  size?: number
}
