import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, View } from 'react-native'

import { Button } from '@/components/ui/Button'
import { Screen } from '@/components/ui/Screen'
import { LAYOUT } from '@/helpers/layout.style'
import { DashboardHeader } from '@/screens/ItemsDashboard/components/DashboardHeader'
import { DashboardNav } from '@/screens/ItemsDashboard/components/DashboardNav'
import { ItemsListCard } from '@/screens/ItemsDashboard/components/ItemsListCard'
import { StatsCard } from '@/screens/ItemsDashboard/components/StatsCard'
import { useItems } from '@/screens/ItemsDashboard/hooks/useItems.hook'
import {
  NAV_BOTTOM,
  VIEW_ALL_MARGIN_TOP
} from '@/screens/ItemsDashboard/ItemsDashboard.constant'

const navContainerStyle = {
  alignItems: 'center' as const,
  bottom: NAV_BOTTOM,
  left: 0,
  position: 'absolute' as const,
  right: 0
}

const viewAllStyle = {
  marginTop: VIEW_ALL_MARGIN_TOP
}

export const ItemsDashboardScreen = () => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'items.dashboard'
  })

  const {
    activeCount,
    activeNav,
    isLoading,
    items,
    onNavChange,
    onSearchChange,
    search,
    totalCount
  } = useItems()

  return (
    <Screen>
      <SafeAreaView style={LAYOUT.contentArea}>
        <ScrollView
          contentContainerStyle={[
            LAYOUT.maxWidth,
            LAYOUT.screenPadding,
            LAYOUT.sectionGap,
            { paddingBottom: 120, paddingTop: 48 }
          ]}
          showsVerticalScrollIndicator={false}
          style={LAYOUT.contentArea}
        >
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

          <View style={viewAllStyle}>
            <Button fullWidth variant="primary">
              {t('viewAll')}
            </Button>
          </View>
        </ScrollView>

        <View style={navContainerStyle}>
          <DashboardNav activeId={activeNav} onItemPress={onNavChange} />
        </View>
      </SafeAreaView>
    </Screen>
  )
}
