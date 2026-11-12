import type { ReactNode } from 'react'

export interface ISettingRowProps {
  control?: ReactNode
  isFirst?: boolean
  label: string
  leading?: ReactNode
  onClick?: () => void
  subtitle?: string
  value?: string
}
