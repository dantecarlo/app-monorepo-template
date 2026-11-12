import type { IconNameType } from '@/components/ui/Icon/Icon.component'

export interface INavBarItem {
  icon: IconNameType
  id: string
  label: string
}

export interface INavBarProps {
  activeId: string
  ariaLabel: string
  items: ReadonlyArray<INavBarItem>
  onItemPress: (id: string) => void
}
