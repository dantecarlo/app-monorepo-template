import { colors, spacing } from '@app/tokens'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'

import { ItemCard } from '@/features/items/components/ItemCard.component'
import { useItems } from '@/features/items/hooks/useItems.hook'
import { GLASS, LAYOUT, TEXT } from '@/helpers/style.constant'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NavTabType = 'home' | 'items' | 'search' | 'settings'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const DashboardHeader = () => {
  return (
    <View
      style={{
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between'
      }}
    >
      {/* Wordmark */}
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          gap: spacing.md
        }}
      >
        <LinearGradient
          colors={['#FF8A3D', '#FF6A1A']}
          style={{
            alignItems: 'center',
            borderRadius: 8,
            height: 36,
            justifyContent: 'center',
            width: 36
          }}
        >
          <Text
            style={{
              color: colors.accentInk,
              fontSize: 16,
              fontWeight: '800'
            }}
          >
            A
          </Text>
        </LinearGradient>
        <View>
          <Text style={TEXT.caption}>Welcome back</Text>
          <Text style={TEXT.title}>Dashboard</Text>
        </View>
      </View>

      {/* Settings button */}
      <TouchableOpacity
        accessibilityLabel="Settings"
        style={[
          GLASS.card,
          {
            alignItems: 'center',
            borderRadius: 20,
            height: 40,
            justifyContent: 'center',
            width: 40
          }
        ]}
      >
        <Text style={{ color: colors.text.secondary, fontSize: 18 }}>
          ⚙
        </Text>
      </TouchableOpacity>
    </View>
  )
}

interface IStatsCardProps {
  activeCount: number
  isLoading: boolean
  totalCount: number
}

const StatsCard = ({
  activeCount,
  isLoading,
  totalCount
}: IStatsCardProps) => {
  return (
    <BlurView
      intensity={40}
      style={[
        GLASS.card,
        GLASS.cardPadding,
        { borderRadius: 26, overflow: 'hidden' }
      ]}
      tint="dark"
    >
      {/* Header row */}
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 12
        }}
      >
        <Text style={TEXT.label}>Overview</Text>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: colors.successTint,
            borderRadius: 9999,
            flexDirection: 'row',
            gap: 6,
            paddingHorizontal: 11,
            paddingVertical: 5
          }}
        >
          <View
            style={{
              backgroundColor: colors.success,
              borderRadius: 4,
              height: 7,
              width: 7
            }}
          />
          <Text
            style={[
              TEXT.caption,
              { color: colors.success, fontWeight: '500' }
            ]}
          >
            Live
          </Text>
        </View>
      </View>

      {/* Hero stat */}
      <Text style={TEXT.amountHero}>{isLoading ? '—' : totalCount}</Text>
      <Text style={[TEXT.label, { marginTop: 4 }]}>total items</Text>

      {/* Sub-row */}
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          marginTop: 12
        }}
      >
        <View
          style={{
            backgroundColor: colors.accentTint,
            borderRadius: 9999,
            paddingHorizontal: 11,
            paddingVertical: 5
          }}
        >
          <Text
            style={[
              TEXT.caption,
              { color: colors.accent, fontWeight: '500' }
            ]}
          >
            {isLoading ? '—' : activeCount} active
          </Text>
        </View>
        <Text style={TEXT.caption}>· updated just now</Text>
      </View>
    </BlurView>
  )
}

interface ISearchBarProps {
  onChange: (value: string) => void
  value: string
}

const SearchBar = ({ onChange, value }: ISearchBarProps) => {
  return (
    <BlurView
      intensity={30}
      style={[
        GLASS.card,
        {
          alignItems: 'center',
          borderRadius: 14,
          flexDirection: 'row',
          gap: 10,
          overflow: 'hidden',
          paddingHorizontal: 16,
          paddingVertical: 12
        }
      ]}
      tint="dark"
    >
      <Text style={{ color: colors.text.tertiary, fontSize: 16 }}>⌕</Text>
      <TextInput
        onChangeText={onChange}
        placeholder="Search items…"
        placeholderTextColor={colors.text.tertiary}
        style={[TEXT.body, { flex: 1 }]}
        value={value}
      />
    </BlurView>
  )
}

interface IItemsListCardProps {
  isLoading: boolean
  items: ReturnType<typeof useItems>['data']
  onSearchChange: (v: string) => void
  search: string
}

const ItemsListCard = ({
  isLoading,
  items = [],
  onSearchChange,
  search
}: IItemsListCardProps) => {
  return (
    <BlurView
      intensity={40}
      style={[GLASS.card, { borderRadius: 26, overflow: 'hidden' }]}
      tint="dark"
    >
      {/* Card header */}
      <View style={[GLASS.cardPadding, { gap: 12 }]}>
        <View
          style={{
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'space-between'
          }}
        >
          <Text style={TEXT.title}>Items</Text>
          <Text style={TEXT.caption}>
            {isLoading ? '…' : `${items.length} results`}
          </Text>
        </View>
        <SearchBar onChange={onSearchChange} value={search} />
      </View>

      {/* Item rows */}
      <View style={{ paddingBottom: 8, paddingHorizontal: 20 }}>
        {isLoading ? (
          <ActivityIndicator
            color={colors.accent}
            style={{ paddingVertical: 24 }}
          />
        ) : items.length === 0 ? (
          <Text
            style={[
              TEXT.body,
              {
                color: colors.text.tertiary,
                paddingVertical: 24,
                textAlign: 'center'
              }
            ]}
          >
            No items found.
          </Text>
        ) : (
          items.map((item, index) => (
            <ItemCard
              isLast={index === items.length - 1}
              item={item}
              key={item.id}
            />
          ))
        )}
      </View>
    </BlurView>
  )
}

interface IFloatingNavProps {
  activeTab: NavTabType
  onTabChange: (tab: NavTabType) => void
}

const NAV_TABS: { icon: string; id: NavTabType; label: string }[] = [
  { icon: '⌂', id: 'home', label: 'Home' },
  { icon: '☰', id: 'items', label: 'Items' },
  { icon: '⌕', id: 'search', label: 'Search' },
  { icon: '⚙', id: 'settings', label: 'Settings' }
]

const FloatingNav = ({ activeTab, onTabChange }: IFloatingNavProps) => {
  return (
    <BlurView
      intensity={60}
      style={[
        GLASS.card,
        {
          alignItems: 'center',
          borderRadius: 9999,
          flexDirection: 'row',
          gap: 24,
          overflow: 'hidden',
          paddingHorizontal: 24,
          paddingVertical: 12
        }
      ]}
      tint="dark"
    >
      {NAV_TABS.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            style={{ alignItems: 'center', gap: 2 }}
          >
            <Text
              style={{
                color: isActive ? colors.accent : colors.text.tertiary,
                fontSize: 22
              }}
            >
              {tab.icon}
            </Text>
            <Text
              style={[
                TEXT.caption,
                { color: isActive ? colors.accent : colors.text.tertiary }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </BlurView>
  )
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export const ItemsDashboard = () => {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<NavTabType>('home')

  const { data: items = [], isLoading } = useItems({ search })

  const summary = useMemo(() => {
    const activeCount = items.filter((i) => i.status === 'active').length
    return { activeCount, totalCount: items.length }
  }, [items])

  return (
    <SafeAreaView style={LAYOUT.screen}>
      <ScrollView
        contentContainerStyle={[
          LAYOUT.maxWidth,
          LAYOUT.screenPadding,
          { gap: 16, paddingBottom: 120, paddingTop: 48 }
        ]}
        showsVerticalScrollIndicator={false}
        style={LAYOUT.contentArea}
      >
        <DashboardHeader />

        <StatsCard
          activeCount={summary.activeCount}
          isLoading={isLoading}
          totalCount={summary.totalCount}
        />

        <ItemsListCard
          isLoading={isLoading}
          items={items}
          onSearchChange={setSearch}
          search={search}
        />

        {/* Primary CTA */}
        <TouchableOpacity accessibilityRole="button">
          <LinearGradient
            colors={['#FF8A3D', '#FF6A1A']}
            style={{
              alignItems: 'center',
              borderRadius: 9999,
              height: 48,
              justifyContent: 'center',
              marginTop: 8
            }}
          >
            <Text
              style={{
                color: colors.accentInk,
                fontSize: 15,
                fontWeight: '700'
              }}
            >
              View all items
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating nav — centered bottom pill */}
      <View
        style={{
          alignItems: 'center',
          bottom: 24,
          left: 0,
          position: 'absolute',
          right: 0
        }}
      >
        <FloatingNav activeTab={activeTab} onTabChange={setActiveTab} />
      </View>
    </SafeAreaView>
  )
}
