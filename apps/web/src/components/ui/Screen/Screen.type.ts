import type { ReactNode } from 'react'

export interface IScreenProps {
  children: ReactNode
  /** Positioning classes only, such as the stacking of the surface. */
  className?: string
}
