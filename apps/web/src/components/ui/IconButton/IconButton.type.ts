import type { ButtonHTMLAttributes } from 'react'
import type { VariantProps } from 'tailwind-variants'

import type { IconNameType } from '@/components/ui/Icon/Icon.component'
import { iconButtonVariants } from '@/components/ui/IconButton/IconButton.style'

export interface IIconButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  accessibilityLabel: string
  name: IconNameType
}
