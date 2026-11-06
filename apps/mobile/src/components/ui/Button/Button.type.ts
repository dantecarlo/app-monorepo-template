import type {
  ButtonSizeType,
  ButtonVariantType
} from '@/components/ui/Button/Button.constant'

export interface IButtonProps {
  accessibilityLabel?: string
  children?: React.ReactNode
  disabled?: boolean
  fullWidth?: boolean
  isLoading?: boolean
  onPress?: () => void
  size?: ButtonSizeType
  variant?: ButtonVariantType
}
