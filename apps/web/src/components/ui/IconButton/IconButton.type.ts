import type { ButtonHTMLAttributes } from 'react'

import type { IconNameType } from '@/components/ui/Icon/Icon.component'
import type { IconButtonVariantType } from '@/components/ui/IconButton/IconButton.constant'

export interface IIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  accessibilityLabel: string
  name: IconNameType
  variant?: IconButtonVariantType
}
