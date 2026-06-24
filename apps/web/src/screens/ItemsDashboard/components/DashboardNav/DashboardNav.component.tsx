'use client'

import { useTranslations } from 'next-intl'

import { Icon } from '@/components/ui/Icon/Icon.component'
import type { INavBarItem } from '@/components/ui/NavBar'
import { NavBar } from '@/components/ui/NavBar'
import { DASHBOARD_NAV_ICON_SIZE } from '@/screens/ItemsDashboard/components/DashboardNav/DashboardNav.styles'

export interface IDashboardNavProps {
  activeId: string
  onItemPress: (id: string) => void
}

export const DashboardNav = ({
  activeId,
  onItemPress
}: IDashboardNavProps) => {
  const t = useTranslations('items.dashboard.nav')

  const navItems: INavBarItem[] = [
    {
      icon: <Icon decorative name="home" size={DASHBOARD_NAV_ICON_SIZE} />,
      id: 'home',
      label: t('home')
    },
    {
      icon: (
        <Icon decorative name="filter" size={DASHBOARD_NAV_ICON_SIZE} />
      ),
      id: 'list',
      label: t('items')
    },
    {
      icon: (
        <Icon decorative name="search" size={DASHBOARD_NAV_ICON_SIZE} />
      ),
      id: 'search',
      label: t('search')
    },
    {
      icon: (
        <Icon decorative name="settings" size={DASHBOARD_NAV_ICON_SIZE} />
      ),
      id: 'settings',
      label: t('settings')
    }
  ]

  return (
    <NavBar
      activeId={activeId}
      ariaLabel={t('ariaLabel')}
      items={navItems}
      onItemPress={onItemPress}
    />
  )
}
