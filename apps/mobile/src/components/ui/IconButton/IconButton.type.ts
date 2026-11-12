import type { IconNameType } from '@/components/ui/Icon/Icon.component'

export type IconButtonVariantType = 'glass' | 'accent'

export interface IIconButtonProps {
  accessibilityLabel: string
  name: IconNameType
  onPress: () => void
  variant?: IconButtonVariantType
}
