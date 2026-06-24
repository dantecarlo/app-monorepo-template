import { useTranslation } from 'react-i18next'

import { NavBar } from '@/components/ui/NavBar'
import type { INavBarItem } from '@/components/ui/NavBar/NavBar.component'

export interface IDashboardNavProps {
  activeId: string
  onItemPress: (id: string) => void
}

export const DashboardNav = ({
  activeId,
  onItemPress
}: IDashboardNavProps) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'items.dashboard.nav'
  })

  const NAV_ITEMS: ReadonlyArray<INavBarItem> = [
    { icon: 'home', id: 'home', label: t('home') },
    { icon: 'filter', id: 'items', label: t('items') },
    { icon: 'search', id: 'search', label: t('search') },
    { icon: 'settings', id: 'settings', label: t('settings') }
  ]

  return (
    <NavBar
      activeId={activeId}
      ariaLabel={t('ariaLabel')}
      items={NAV_ITEMS}
      onItemPress={onItemPress}
    />
  )
}
