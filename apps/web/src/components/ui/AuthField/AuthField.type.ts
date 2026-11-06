import type { InputHTMLAttributes } from 'react'
import type { HTMLInputTypeAttribute } from 'react'

export interface IAuthFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className'
> {
  helperText?: string
  hidePasswordLabel: string
  isError?: boolean
  isPassword?: boolean
  label?: string
  showPasswordLabel: string
}

export interface IUseAuthFieldParams {
  isError: boolean
  isPassword: boolean
  type?: HTMLInputTypeAttribute
}

export interface IUseAuthFieldResult {
  inputType: HTMLInputTypeAttribute
  onTogglePassword: () => void
  showPassword: boolean
  wrapperClass: string
}
