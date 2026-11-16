import { LanguageEnum, resources } from '@app/i18n'
import { describe, expect, test } from 'vitest'

import { ItemCard } from '@/screens/ItemsDashboard/components/ItemCard/ItemCard.component'
import type { IItemViewModel } from '@/screens/ItemsDashboard/models/Item.type'
import { ItemAgeUnitEnum } from '@/services/Items/items.constant'
import { renderWithI18n } from '@/test/i18n.helper'
import { screen } from '@/test/test.helper'

const AGE_IN_HOURS = 3

const MOCK_ITEM: IItemViewModel = {
  age: { count: AGE_IN_HOURS, unit: ItemAgeUnitEnum.HOURS },
  authorInitials: 'AB',
  authorLabel: 'Author A',
  category: 'design',
  createdAt: new Date('2024-01-01'),
  description: 'A test item description',
  id: '1',
  status: 'active',
  title: 'Test Item'
}

describe('ItemCard (mobile)', () => {
  test('renders without returning null', () => {
    renderWithI18n({ ui: <ItemCard item={MOCK_ITEM} /> })
    expect(screen.getByText('Test Item')).toBeTruthy()
  })

  test('renders without returning null as last item', () => {
    renderWithI18n({ ui: <ItemCard isLast item={MOCK_ITEM} /> })
    expect(screen.getByText('Test Item')).toBeTruthy()
  })

  test('shows the status and the age in the active language', () => {
    for (const language of [LanguageEnum.EN, LanguageEnum.ES]) {
      const { items } = resources[language].translation
      const { unmount } = renderWithI18n({
        language,
        ui: <ItemCard item={MOCK_ITEM} />
      })

      expect(
        screen.getByText(
          items.age.hours.replace('{count}', String(AGE_IN_HOURS))
        )
      ).toBeTruthy()
      expect(screen.getByText(items.status.active)).toBeTruthy()
      unmount()
    }
  })
})
