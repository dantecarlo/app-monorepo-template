'use client'

import { Button } from '@/components/ui/Button'
import { Screen } from '@/components/ui/Screen'
import { LAYOUT } from '@/helpers/layout.style'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'
import { DashboardHeader } from '@/screens/ItemsDashboard/components/DashboardHeader'
import { DashboardNav } from '@/screens/ItemsDashboard/components/DashboardNav'
import { ItemsListCard } from '@/screens/ItemsDashboard/components/ItemsListCard'
import { StatsCard } from '@/screens/ItemsDashboard/components/StatsCard'
import { useItems } from '@/screens/ItemsDashboard/hooks/useItems.hook'
import { ITEMS_DASHBOARD } from '@/screens/ItemsDashboard/ItemsDashboard.style'

export const ItemsDashboardScreen = () => {
  const { t } = useAppTranslator()

  const {
    activeCount,
    activeNav,
    isError,
    isLoading,
    items,
    onNavChange,
    onRetry,
    onSearchChange,
    search,
    totalCount
  } = useItems()

  return (
    <Screen className={LAYOUT.CONTENT_AREA}>
      <main className={ITEMS_DASHBOARD.MAIN}>
        <div className={LAYOUT.SECTION_GAP}>
          <DashboardHeader />
          <StatsCard
            activeCount={activeCount}
            isLoading={isLoading}
            totalCount={totalCount}
          />
          <ItemsListCard
            isError={isError}
            isLoading={isLoading}
            items={items}
            onRetry={onRetry}
            onSearchChange={onSearchChange}
            search={search}
          />
          <Button
            className={ITEMS_DASHBOARD.VIEW_ALL_BUTTON}
            fullWidth
            variant="primary"
          >
            {t('items.dashboard.viewAll')}
          </Button>
        </div>
      </main>

      <DashboardNav activeId={activeNav} onItemPress={onNavChange} />
    </Screen>
  )
}
