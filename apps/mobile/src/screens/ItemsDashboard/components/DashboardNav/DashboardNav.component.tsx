import { NavBar } from '@/components/ui/NavBar'
import type { INavBarItem } from '@/components/ui/NavBar/NavBar.type'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'
import type { IDashboardNavProps } from '@/screens/ItemsDashboard/components/DashboardNav/DashboardNav.type'

export const DashboardNav = ({
  activeId,
  onItemPress
}: IDashboardNavProps) => {
  const { t } = useAppTranslator()

  const NAV_ITEMS: ReadonlyArray<INavBarItem> = [
    { icon: 'home', id: 'home', label: t('items.dashboard.nav.home') },
    { icon: 'filter', id: 'items', label: t('items.dashboard.nav.items') },
    {
      icon: 'search',
      id: 'search',
      label: t('items.dashboard.nav.search')
    },
    {
      icon: 'settings',
      id: 'settings',
      label: t('items.dashboard.nav.settings')
    }
  ]

  return (
    <NavBar
      activeId={activeId}
      ariaLabel={t('items.dashboard.nav.ariaLabel')}
      items={NAV_ITEMS}
      onItemPress={onItemPress}
    />
  )
}
