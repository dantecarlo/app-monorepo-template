import type { ReactNode } from 'react'

export interface IListRowProps {
  leading?: ReactNode
  onClick?: () => void
  subtitle?: string
  title: string
  trailing?: ReactNode
}
