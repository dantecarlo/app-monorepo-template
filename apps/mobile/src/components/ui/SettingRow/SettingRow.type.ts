import type { ReactNode } from 'react'

export interface ISettingRowProps {
  control?: ReactNode
  isFirst?: boolean
  label: string
  leading?: ReactNode
  onPress?: () => void
  subtitle?: string
  value?: string
}
