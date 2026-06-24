import { describe, expect, test, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

vi.mock('@/components/ui/GlassCard', () => ({
  GlassCard: ({ children }: { children?: unknown }) => children
}))

vi.mock('@/components/ui/SearchBar', () => ({
  SearchBar: () => null
}))

vi.mock('@/components/ui/EmptyState', () => ({
  EmptyState: () => null
}))

vi.mock('@/screens/ItemsDashboard/components/ItemCard', () => ({
  GRADIENT_BRAND_COLORS: ['#FF8A3D', '#FF6A1A'],
  ItemCard: () => null
}))

import { ItemsListCard } from './ItemsListCard.component'

describe('ItemsListCard (mobile)', () => {
  test('renders without returning null when loading', () => {
    const result = ItemsListCard({
      isLoading: true,
      items: [],
      onSearchChange: () => undefined,
      search: ''
    })
    expect(result).not.toBeNull()
  })

  test('renders without returning null when empty', () => {
    const result = ItemsListCard({
      isLoading: false,
      items: [],
      onSearchChange: () => undefined,
      search: ''
    })
    expect(result).not.toBeNull()
  })

  test('renders without returning null with items', () => {
    const items = [
      {
        authorInitials: 'AB',
        authorLabel: 'Author A',
        category: 'cat',
        createdAt: new Date('2024-01-01'),
        description: 'desc',
        id: '1',
        status: 'active' as const,
        timeDisplay: '1h ago',
        title: 'Item 1'
      }
    ]
    const result = ItemsListCard({
      isLoading: false,
      items,
      onSearchChange: () => undefined,
      search: ''
    })
    expect(result).not.toBeNull()
  })
})
