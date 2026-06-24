import type { JSX, ReactNode } from 'react'

import {
  NAV_BAR_ITEM_ACTIVE_CLASS,
  NAV_BAR_ITEM_BASE_CLASS,
  NAV_BAR_ITEM_INACTIVE_CLASS,
  NAV_BAR_LABEL_CLASS,
  NAV_BAR_PILL_CLASS,
  NAV_BAR_ROOT_CLASS
} from '@/components/ui/NavBar/NavBar.constant'

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

/** Floating glass pill navigation bar. Navigation-agnostic: caller owns routing. */
export const NavBar = ({
  activeId,
  ariaLabel,
  items,
  onItemPress
}: INavBarProps): JSX.Element => (
  <nav aria-label={ariaLabel} className={NAV_BAR_ROOT_CLASS}>
    <div className={NAV_BAR_PILL_CLASS} role="tablist">
      {items.map(({ icon, id, label }) => {
        const isActive = id === activeId
        const itemClass = [
          NAV_BAR_ITEM_BASE_CLASS,
          isActive
            ? NAV_BAR_ITEM_ACTIVE_CLASS
            : NAV_BAR_ITEM_INACTIVE_CLASS
        ].join(' ')

        return (
          <button
            aria-selected={isActive}
            className={itemClass}
            key={id}
            onClick={() => onItemPress(id)}
            role="tab"
            type="button"
          >
            <span className="text-[22px] leading-none">{icon}</span>
            <span className={NAV_BAR_LABEL_CLASS}>{label}</span>
          </button>
        )
      })}
    </div>
  </nav>
)
