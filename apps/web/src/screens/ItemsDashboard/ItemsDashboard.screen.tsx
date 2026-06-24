'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { LAYOUT } from '@/helpers/style.constant'
import { DashboardHeader } from '@/screens/ItemsDashboard/components/DashboardHeader'
import { DashboardNav } from '@/screens/ItemsDashboard/components/DashboardNav'
import { ItemsListCard } from '@/screens/ItemsDashboard/components/ItemsListCard'
import { StatsCard } from '@/screens/ItemsDashboard/components/StatsCard'
import { useItems } from '@/screens/ItemsDashboard/hooks/useItems.hook'
import { ITEMS_DASHBOARD } from '@/screens/ItemsDashboard/ItemsDashboard.styles'

export const ItemsDashboardScreen = () => {
  const [activeNav, setActiveNav] = useState('home')
  const t = useTranslations('items.dashboard')

  const {
    activeCount,
    isLoading,
    items,
    onSearchChange,
    search,
    totalCount
  } = useItems()

  return (
    <div className={`${LAYOUT.SCREEN} ${LAYOUT.CONTENT_AREA}`}>
      <main className={ITEMS_DASHBOARD.MAIN}>
        <div className={LAYOUT.SECTION_GAP}>
          <DashboardHeader />
          <StatsCard
            activeCount={activeCount}
            isLoading={isLoading}
            totalCount={totalCount}
          />
          <ItemsListCard
            isLoading={isLoading}
            items={items}
            onSearchChange={onSearchChange}
            search={search}
          />
          <Button className="mt-2" fullWidth variant="primary">
            {t('viewAll')}
          </Button>
        </div>
      </main>

      <DashboardNav activeId={activeNav} onItemPress={setActiveNav} />
    </div>
  )
}
