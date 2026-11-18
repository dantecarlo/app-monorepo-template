import type { ButtonHTMLAttributes } from 'react'

import type {
  ButtonSizeType,
  ButtonVariantType
} from '@/components/ui/Button/Button.constant'

export interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean
  isLoading?: boolean
  size?: ButtonSizeType
  variant?: ButtonVariantType
}
