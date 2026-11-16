import { describe, expect, test, vi } from 'vitest'

import { fireEvent, render, screen, within } from '@/test/test.helper'

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
  EmptyState: () => 'empty-state'
}))

vi.mock('@/screens/ItemsDashboard/components/ItemCard', () => ({
  ItemCard: () => null
}))

import { ItemsListCard } from '@/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component'

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

  test('shows the error state with a retry when the items failed to load', () => {
    const onRetry = vi.fn()
    render(
      <ItemsListCard
        isError
        isLoading={false}
        items={[]}
        onRetry={onRetry}
        onSearchChange={() => undefined}
        search=""
      />
    )

    const alert = within(screen.getByRole('alert'))
    expect(alert.getByText('components.errorState.title')).toBeTruthy()
    expect(screen.queryByText('empty-state')).toBeNull()

    fireEvent.click(
      screen.getByRole('button', { name: 'components.errorState.retry' })
    )

    expect(onRetry).toHaveBeenCalledOnce()
  })
})
