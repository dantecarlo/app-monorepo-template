import { describe, expect, test } from 'vitest'

import { ItemCard } from './ItemCard.component'

const MOCK_ITEM = {
  authorInitials: 'AB',
  authorLabel: 'Author A',
  category: 'design',
  createdAt: new Date('2024-01-01'),
  description: 'A test item description',
  id: '1',
  status: 'active' as const,
  timeDisplay: '2h ago',
  title: 'Test Item'
}

describe('ItemCard (mobile)', () => {
  test('renders without returning null', () => {
    const result = ItemCard({ item: MOCK_ITEM })
    expect(result).not.toBeNull()
  })

  test('renders without returning null as last item', () => {
    const result = ItemCard({ isLast: true, item: MOCK_ITEM })
    expect(result).not.toBeNull()
  })
})
