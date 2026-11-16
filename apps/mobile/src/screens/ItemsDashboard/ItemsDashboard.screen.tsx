import { SafeAreaView, ScrollView, View } from 'react-native'

import { Screen } from '@/components/ui/Screen'
import { LAYOUT } from '@/helpers/layout.style'
import { DashboardHeader } from '@/screens/ItemsDashboard/components/DashboardHeader'
import { DashboardNav } from '@/screens/ItemsDashboard/components/DashboardNav'
import { ItemsListCard } from '@/screens/ItemsDashboard/components/ItemsListCard'
import { StatsCard } from '@/screens/ItemsDashboard/components/StatsCard'
import { useItems } from '@/screens/ItemsDashboard/hooks/useItems.hook'
import { NAV_BOTTOM } from '@/screens/ItemsDashboard/ItemsDashboard.constant'

const navContainerStyle = {
  alignItems: 'center' as const,
  bottom: NAV_BOTTOM,
  left: 0,
  position: 'absolute' as const,
  right: 0
}

export const ItemsDashboardScreen = () => {
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
            isError={isError}
            isLoading={isLoading}
            items={items}
            onRetry={onRetry}
            onSearchChange={onSearchChange}
            search={search}
          />
        </ScrollView>

        <View style={navContainerStyle}>
          <DashboardNav activeId={activeNav} onItemPress={onNavChange} />
        </View>
      </SafeAreaView>
    </Screen>
  )
}
