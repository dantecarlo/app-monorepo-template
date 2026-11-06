import type { ReactNode } from 'react'

export interface INavBarItem {
  icon: ReactNode
  id: string
  label: string
}

export interface INavBarProps {
  activeId: string
  ariaLabel: string
  items: ReadonlyArray<INavBarItem>
  onItemPress: (id: string) => void
}
