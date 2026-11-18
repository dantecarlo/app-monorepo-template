'use client'

import { glyphSize } from '@app/tokens'

import { Icon } from '@/components/ui/Icon/Icon.component'
import type { INavBarItem } from '@/components/ui/NavBar'
import { NavBar } from '@/components/ui/NavBar'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'
import type { IDashboardNavProps } from '@/screens/ItemsDashboard/components/DashboardNav/DashboardNav.type'

export const DashboardNav = ({
  activeId,
  onItemPress
}: IDashboardNavProps) => {
  const { t } = useAppTranslator()

  const navItems: INavBarItem[] = [
    {
      icon: <Icon decorative name="home" size={glyphSize.navIcon} />,
      id: 'home',
      label: t('items.dashboard.nav.home')
    },
    {
      icon: <Icon decorative name="filter" size={glyphSize.navIcon} />,
      id: 'list',
      label: t('items.dashboard.nav.items')
    },
    {
      icon: <Icon decorative name="search" size={glyphSize.navIcon} />,
      id: 'search',
      label: t('items.dashboard.nav.search')
    },
    {
      icon: <Icon decorative name="settings" size={glyphSize.navIcon} />,
      id: 'settings',
      label: t('items.dashboard.nav.settings')
    }
  ]

  return (
    <NavBar
      activeId={activeId}
      ariaLabel={t('items.dashboard.nav.ariaLabel')}
      items={navItems}
      onItemPress={onItemPress}
    />
  )
}
