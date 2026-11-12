import type { ReactNode } from 'react'

export interface IListRowProps {
  isFirst?: boolean
  leading?: ReactNode
  onPress?: () => void
  subtitle?: string
  title: string
  trailing?: ReactNode
}
