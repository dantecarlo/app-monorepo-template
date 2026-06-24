import { describe, expect, test, vi } from 'vitest'

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useState: (init: unknown) => [init, () => undefined]
  }
})

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: unknown }) => children
}))

vi.mock('@/screens/ItemsDashboard/hooks/useItems.hook', () => ({
  useItems: () => ({
    activeCount: 2,
    isLoading: false,
    items: [],
    onSearchChange: () => undefined,
    search: '',
    totalCount: 2
  })
}))

vi.mock('@/screens/ItemsDashboard/components/DashboardHeader', () => ({
  DashboardHeader: () => null
}))

vi.mock('@/screens/ItemsDashboard/components/StatsCard', () => ({
  StatsCard: () => null
}))

vi.mock('@/screens/ItemsDashboard/components/ItemsListCard', () => ({
  ItemsListCard: () => null
}))

vi.mock('@/screens/ItemsDashboard/components/DashboardNav', () => ({
  DashboardNav: () => null
}))

vi.mock('@/screens/ItemsDashboard/components/ItemCard', () => ({
  GRADIENT_BRAND_COLORS: ['#FF8A3D', '#FF6A1A']
}))

import { ItemsDashboardScreen } from './ItemsDashboard.screen'

describe('ItemsDashboardScreen (mobile)', () => {
  test('renders without returning null', () => {
    const result = ItemsDashboardScreen()
    expect(result).not.toBeNull()
  })
})
