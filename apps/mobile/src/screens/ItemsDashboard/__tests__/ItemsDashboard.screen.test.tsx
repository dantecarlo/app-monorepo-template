import { describe, expect, test, vi } from 'vitest'

import { render, screen } from '@/test/test.helper'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
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

import { ItemsDashboardScreen } from '@/screens/ItemsDashboard/ItemsDashboard.screen'

describe('ItemsDashboardScreen (mobile)', () => {
  test('renders without returning null', () => {
    const result = ItemsDashboardScreen()
    expect(result).not.toBeNull()
  })

  test('shows no View all button', () => {
    render(<ItemsDashboardScreen />)

    expect(screen.queryByText('viewAll')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })
})
