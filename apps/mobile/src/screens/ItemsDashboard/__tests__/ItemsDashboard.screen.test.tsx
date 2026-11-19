import { beforeEach, describe, expect, test, vi } from 'vitest'

import { render, screen } from '@/test/test.helper'

const { mockUseItems } = vi.hoisted(() => ({ mockUseItems: vi.fn() }))

const LOADED_ITEMS = {
  activeCount: 2,
  isError: false,
  isLoading: false,
  items: [],
  onSearchChange: () => undefined,
  search: '',
  totalCount: 2
}

vi.mock('@/lib/i18n/useAppTranslator.hook', () => ({
  useAppTranslator: () => ({
    has: () => false,
    locale: 'en',
    t: (key: string) => key
  })
}))

vi.mock('@/screens/ItemsDashboard/hooks/useItems.hook', () => ({
  useItems: mockUseItems
}))

vi.mock('@/screens/ItemsDashboard/components/DashboardHeader', () => ({
  DashboardHeader: () => null
}))

// The stats card renders for real, inside a pass-through card.
vi.mock('@/components/ui/GlassCard', () => ({
  GlassCard: ({ children }: { children?: unknown }) => children
}))

vi.mock('@/screens/ItemsDashboard/components/ItemsListCard', () => ({
  ItemsListCard: () => null
}))

vi.mock('@/screens/ItemsDashboard/components/DashboardNav', () => ({
  DashboardNav: () => null
}))

import { ItemsDashboardScreen } from '@/screens/ItemsDashboard/ItemsDashboard.screen'

describe('ItemsDashboardScreen (mobile)', () => {
  beforeEach(() => {
    mockUseItems.mockReturnValue(LOADED_ITEMS)
  })

  test('renders without returning null', () => {
    const result = ItemsDashboardScreen()
    expect(result).not.toBeNull()
  })

  test('shows no View all button', () => {
    render(<ItemsDashboardScreen />)

    expect(screen.queryByText('items.dashboard.viewAll')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })

  test('shows no total on the stats card when the items failed to load', () => {
    mockUseItems.mockReturnValue({
      ...LOADED_ITEMS,
      activeCount: 0,
      isError: true,
      totalCount: 0
    })
    render(<ItemsDashboardScreen />)

    expect(screen.getByText('items.dashboard.statsOverview')).toBeTruthy()
    expect(screen.queryByText('0')).toBeNull()
    expect(
      screen.queryByText('items.dashboard.statsTotalItems')
    ).toBeNull()
    expect(screen.queryByText(/statsActive/)).toBeNull()
  })
})
