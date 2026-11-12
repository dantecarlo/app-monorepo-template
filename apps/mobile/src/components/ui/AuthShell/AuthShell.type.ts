import type { ReactNode } from 'react'

export interface IAuthShellProps {
  brandLabel: string
  children: ReactNode
  logo?: ReactNode
  subtitle?: string
  title: string
}
