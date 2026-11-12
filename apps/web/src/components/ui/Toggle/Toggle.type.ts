import type { ButtonHTMLAttributes } from 'react'

export interface IToggleProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange' | 'value'
> {
  accessibilityLabel?: string
  onValueChange: (value: boolean) => void
  value: boolean
}
