'use client'

import { glyphSize } from '@app/tokens'
import { useTranslations } from 'next-intl'

import { Icon } from '@/components/ui/Icon/Icon.component'
import type { INavBarItem } from '@/components/ui/NavBar'
import { NavBar } from '@/components/ui/NavBar'
import type { IDashboardNavProps } from '@/screens/ItemsDashboard/components/DashboardNav/DashboardNav.type'

export const DashboardNav = ({
  activeId,
  onItemPress
}: IDashboardNavProps) => {
  const t = useTranslations('items.dashboard.nav')

  const navItems: INavBarItem[] = [
    {
      icon: <Icon decorative name="home" size={glyphSize.navIcon} />,
      id: 'home',
      label: t('home')
    },
    {
      icon: <Icon decorative name="filter" size={glyphSize.navIcon} />,
      id: 'list',
      label: t('items')
    },
    {
      icon: <Icon decorative name="search" size={glyphSize.navIcon} />,
      id: 'search',
      label: t('search')
    },
    {
      icon: <Icon decorative name="settings" size={glyphSize.navIcon} />,
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
