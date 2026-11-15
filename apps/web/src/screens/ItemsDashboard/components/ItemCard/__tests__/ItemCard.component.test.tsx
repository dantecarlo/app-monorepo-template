import { describe, expect, test } from 'vitest'
import { axe } from 'vitest-axe'

import { ItemCard } from '@/screens/ItemsDashboard/components/ItemCard/ItemCard.component'
import type { IItemViewModel } from '@/screens/ItemsDashboard/models/Item.type'
import { render, screen } from '@/test/test.helper'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeItem = (
  overrides: Partial<IItemViewModel> = {}
): IItemViewModel => ({
  authorInitials: 'AB',
  authorLabel: 'Alice Brown',
  category: 'UX',
  createdAt: new Date('2026-06-22T10:00:00.000Z'),
  description: 'Streamline the first-run experience.',
  id: 'item_001',
  status: 'active',
  timeDisplay: '2h ago',
  title: 'Improve onboarding flow',
  ...overrides
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ItemCard', () => {
  test('renders the title, description, category and time', () => {
    render(<ItemCard item={makeItem()} />)

    expect(screen.getByText('Improve onboarding flow')).toBeInTheDocument()
    expect(
      screen.getByText('Streamline the first-run experience.')
    ).toBeInTheDocument()
    expect(screen.getByText('UX')).toBeInTheDocument()
    expect(screen.getByText('2h ago')).toBeInTheDocument()
  })

  test('has no accessibility violations', async () => {
    const { container } = render(<ItemCard item={makeItem()} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  test('shows the author label when present', () => {
    render(<ItemCard item={makeItem({ authorLabel: 'Alice Brown' })} />)
    expect(screen.getByText('Alice Brown')).toBeInTheDocument()
  })

  test('omits the author label when empty', () => {
    render(<ItemCard item={makeItem({ authorLabel: '' })} />)
    expect(screen.queryByText('Alice Brown')).not.toBeInTheDocument()
  })
})
