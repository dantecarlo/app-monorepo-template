import { LanguageEnum, resources } from '@app/i18n'
import { describe, expect, test } from 'vitest'
import { axe } from 'vitest-axe'

import { ItemCard } from '@/screens/ItemsDashboard/components/ItemCard/ItemCard.component'
import type { IItemViewModel } from '@/screens/ItemsDashboard/models/Item.type'
import { ItemAgeUnitEnum } from '@/services/Items/items.constant'
import { renderWithIntl } from '@/test/intl.helper'
import { screen } from '@/test/test.helper'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const AGE_IN_HOURS = 2

const makeItem = (
  overrides: Partial<IItemViewModel> = {}
): IItemViewModel => ({
  age: { count: AGE_IN_HOURS, unit: ItemAgeUnitEnum.HOURS },
  authorInitials: 'AB',
  authorLabel: 'Alice Brown',
  category: 'UX',
  createdAt: new Date('2026-06-22T10:00:00.000Z'),
  description: 'Streamline the first-run experience.',
  id: 'item_001',
  status: 'active',
  title: 'Improve onboarding flow',
  ...overrides
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ItemCard', () => {
  test('renders the title, description, category and time', () => {
    renderWithIntl({ ui: <ItemCard item={makeItem()} /> })

    expect(screen.getByText('Improve onboarding flow')).toBeInTheDocument()
    expect(
      screen.getByText('Streamline the first-run experience.')
    ).toBeInTheDocument()
    expect(screen.getByText('UX')).toBeInTheDocument()
    expect(screen.getByText('2h ago')).toBeInTheDocument()
  })

  test('has no accessibility violations', async () => {
    const { container } = renderWithIntl({
      ui: <ItemCard item={makeItem()} />
    })
    expect(await axe(container)).toHaveNoViolations()
  })

  test('shows the status and the age in the active language', () => {
    const spanish = resources[LanguageEnum.ES].translation.items

    renderWithIntl({
      locale: LanguageEnum.ES,
      ui: <ItemCard item={makeItem()} />
    })

    expect(
      screen.getByText(
        spanish.age.hours.replace('{count}', String(AGE_IN_HOURS))
      )
    ).toBeInTheDocument()
    expect(screen.getByText(spanish.status.active)).toBeInTheDocument()
  })

  test('shows the author label when present', () => {
    renderWithIntl({
      ui: <ItemCard item={makeItem({ authorLabel: 'Alice Brown' })} />
    })
    expect(screen.getByText('Alice Brown')).toBeInTheDocument()
  })

  test('omits the author label when empty', () => {
    renderWithIntl({
      ui: <ItemCard item={makeItem({ authorLabel: '' })} />
    })
    expect(screen.queryByText('Alice Brown')).not.toBeInTheDocument()
  })
})
