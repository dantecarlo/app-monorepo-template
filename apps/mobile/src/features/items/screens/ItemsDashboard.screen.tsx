import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useItems } from '@/features/items/hooks/useItems.hook';
import { ItemCard } from '@/features/items/components/ItemCard.component';
import { LAYOUT, GLASS, TEXT } from '@/helpers/style.constant';
import { colors, spacing } from '@app/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NavTab = 'home' | 'items' | 'search' | 'settings';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DashboardHeader() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      {/* Wordmark */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <LinearGradient
          colors={['#FF8A3D', '#FF6A1A']}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{ color: colors.accentInk, fontWeight: '800', fontSize: 16 }}
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
        style={[
          GLASS.card,
          {
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
        accessibilityLabel="Settings"
      >
        <Text style={{ color: colors.text.secondary, fontSize: 18 }}>⚙</Text>
      </TouchableOpacity>
    </View>
  );
}

interface StatsCardProps {
  totalCount: number;
  activeCount: number;
  isLoading: boolean;
}

function StatsCard({ totalCount, activeCount, isLoading }: StatsCardProps) {
  return (
    <BlurView
      intensity={40}
      tint="dark"
      style={[
        GLASS.card,
        GLASS.cardPadding,
        { overflow: 'hidden', borderRadius: 26 },
      ]}
    >
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={TEXT.label}>Overview</Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: colors.successTint,
            borderRadius: 9999,
            paddingHorizontal: 11,
            paddingVertical: 5,
          }}
        >
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success }} />
          <Text style={[TEXT.caption, { color: colors.success, fontWeight: '500' }]}>Live</Text>
        </View>
      </View>

      {/* Hero stat */}
      <Text style={TEXT.amountHero}>{isLoading ? '—' : totalCount}</Text>
      <Text style={[TEXT.label, { marginTop: 4 }]}>total items</Text>

      {/* Sub-row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <View
          style={{
            backgroundColor: colors.accentTint,
            borderRadius: 9999,
            paddingHorizontal: 11,
            paddingVertical: 5,
          }}
        >
          <Text style={[TEXT.caption, { color: colors.accent, fontWeight: '500' }]}>
            {isLoading ? '—' : activeCount} active
          </Text>
        </View>
        <Text style={TEXT.caption}>· updated just now</Text>
      </View>
    </BlurView>
  );
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <BlurView
      intensity={30}
      tint="dark"
      style={[
        GLASS.card,
        {
          overflow: 'hidden',
          borderRadius: 14,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 10,
        },
      ]}
    >
      <Text style={{ color: colors.text.tertiary, fontSize: 16 }}>⌕</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Search items…"
        placeholderTextColor={colors.text.tertiary}
        style={[TEXT.body, { flex: 1 }]}
      />
    </BlurView>
  );
}

interface ItemsListCardProps {
  items: ReturnType<typeof useItems>['data'];
  isLoading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
}

function ItemsListCard({ items = [], isLoading, search, onSearchChange }: ItemsListCardProps) {
  return (
    <BlurView
      intensity={40}
      tint="dark"
      style={[GLASS.card, { overflow: 'hidden', borderRadius: 26 }]}
    >
      {/* Card header */}
      <View style={[GLASS.cardPadding, { gap: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={TEXT.title}>Items</Text>
          <Text style={TEXT.caption}>
            {isLoading ? '…' : `${items.length} results`}
          </Text>
        </View>
        <SearchBar value={search} onChange={onSearchChange} />
      </View>

      {/* Item rows */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        {isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ paddingVertical: 24 }} />
        ) : items.length === 0 ? (
          <Text style={[TEXT.body, { textAlign: 'center', paddingVertical: 24, color: colors.text.tertiary }]}>
            No items found.
          </Text>
        ) : (
          items.map((item, index) => (
            <ItemCard key={item.id} item={item} isLast={index === items.length - 1} />
          ))
        )}
      </View>
    </BlurView>
  );
}

interface FloatingNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const NAV_TABS: { id: NavTab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'items', label: 'Items', icon: '☰' },
  { id: 'search', label: 'Search', icon: '⌕' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

function FloatingNav({ activeTab, onTabChange }: FloatingNavProps) {
  return (
    <BlurView
      intensity={60}
      tint="dark"
      style={[
        GLASS.card,
        {
          overflow: 'hidden',
          borderRadius: 9999,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingVertical: 12,
          gap: 24,
        },
      ]}
    >
      {NAV_TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            style={{ alignItems: 'center', gap: 2 }}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={{ fontSize: 22, color: isActive ? colors.accent : colors.text.tertiary }}>
              {tab.icon}
            </Text>
            <Text style={[TEXT.caption, { color: isActive ? colors.accent : colors.text.tertiary }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </BlurView>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function ItemsDashboard() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  const { data: items = [], isLoading } = useItems({ search });

  const summary = useMemo(() => {
    const activeCount = items.filter((i) => i.status === 'active').length;
    return { totalCount: items.length, activeCount };
  }, [items]);

  return (
    <SafeAreaView style={LAYOUT.screen}>
      <ScrollView
        style={LAYOUT.contentArea}
        contentContainerStyle={[
          LAYOUT.maxWidth,
          LAYOUT.screenPadding,
          { paddingTop: 48, paddingBottom: 120, gap: 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader />

        <StatsCard
          totalCount={summary.totalCount}
          activeCount={summary.activeCount}
          isLoading={isLoading}
        />

        <ItemsListCard
          items={items}
          isLoading={isLoading}
          search={search}
          onSearchChange={setSearch}
        />

        {/* Primary CTA */}
        <TouchableOpacity accessibilityRole="button">
          <LinearGradient
            colors={['#FF8A3D', '#FF6A1A']}
            style={{
              borderRadius: 9999,
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 8,
            }}
          >
            <Text
              style={{
                color: colors.accentInk,
                fontWeight: '700',
                fontSize: 15,
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
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <FloatingNav activeTab={activeTab} onTabChange={setActiveTab} />
      </View>
    </SafeAreaView>
  );
}
