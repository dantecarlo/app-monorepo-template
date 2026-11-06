import type { ButtonHTMLAttributes } from 'react'
import type { VariantProps } from 'tailwind-variants'

import { buttonVariants } from '@/components/ui/Button/Button.styles'

export interface IButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}
