import { colors } from '@app/tokens'
import { LinearGradient } from 'expo-linear-gradient'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native'

import { LAYOUT } from '@/helpers/style.constant'
import { DashboardHeader } from '@/screens/ItemsDashboard/components/DashboardHeader'
import { DashboardNav } from '@/screens/ItemsDashboard/components/DashboardNav'
import { GRADIENT_BRAND_COLORS } from '@/screens/ItemsDashboard/components/ItemCard'
import { ItemsListCard } from '@/screens/ItemsDashboard/components/ItemsListCard'
import { StatsCard } from '@/screens/ItemsDashboard/components/StatsCard'
import { useItems } from '@/screens/ItemsDashboard/hooks/useItems.hook'

const VIEW_ALL_HEIGHT = 48
const VIEW_ALL_BORDER_RADIUS = 9999
const VIEW_ALL_FONT_SIZE = 15
const VIEW_ALL_FONT_WEIGHT = '700' as const
const VIEW_ALL_MARGIN_TOP = 8
const NAV_BOTTOM = 24

const navContainerStyle = {
  alignItems: 'center' as const,
  bottom: NAV_BOTTOM,
  left: 0,
  position: 'absolute' as const,
  right: 0
}

const viewAllGradientStyle = {
  alignItems: 'center' as const,
  borderRadius: VIEW_ALL_BORDER_RADIUS,
  height: VIEW_ALL_HEIGHT,
  justifyContent: 'center' as const,
  marginTop: VIEW_ALL_MARGIN_TOP
}

const viewAllTextStyle = {
  color: colors.accentInk,
  fontSize: VIEW_ALL_FONT_SIZE,
  fontWeight: VIEW_ALL_FONT_WEIGHT
}

export const ItemsDashboardScreen = () => {
  const [activeTab, setActiveTab] = useState('home')
  const { t } = useTranslation('translation', {
    keyPrefix: 'items.dashboard'
  })

  const {
    activeCount,
    isLoading,
    items,
    onSearchChange,
    search,
    totalCount
  } = useItems()

  return (
    <SafeAreaView style={LAYOUT.screen}>
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

        <TouchableOpacity accessibilityRole="button">
          <LinearGradient
            colors={GRADIENT_BRAND_COLORS}
            style={viewAllGradientStyle}
          >
            <Text style={viewAllTextStyle}>{t('viewAll')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <View style={navContainerStyle}>
        <DashboardNav activeId={activeTab} onItemPress={setActiveTab} />
      </View>
    </SafeAreaView>
  )
}
