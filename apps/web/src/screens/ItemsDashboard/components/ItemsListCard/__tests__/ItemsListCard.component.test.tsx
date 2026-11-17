import { DEFAULT_LANGUAGE, resources } from '@app/i18n'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test } from 'vitest'

import { ItemsListCard } from '@/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component'
import type { IItemViewModel } from '@/screens/ItemsDashboard/models/Item.type'
import { ItemAgeUnitEnum } from '@/services/Items/items.constant'
import { render, screen } from '@/test/test.helper'

const messages = {
  components: {
    emptyState: {
      message: 'There is nothing here yet.',
      title: 'No results'
    },
    errorState:
      resources[DEFAULT_LANGUAGE].translation.components.errorState
  },
  items: {
    age: resources[DEFAULT_LANGUAGE].translation.items.age,
    dashboard: {
      listEmpty: 'No items found.',
      listResults: '{count} results',
      listTitle: 'Items',
      searchLabel: 'Search items',
      searchPlaceholder: 'Search items…'
    },
    status: resources[DEFAULT_LANGUAGE].translation.items.status
  }
}

const makeItem = (id: string): IItemViewModel => ({
  age: { count: 2, unit: ItemAgeUnitEnum.HOURS },
  authorInitials: 'AB',
  authorLabel: 'Alice Brown',
  category: 'UX',
  createdAt: new Date('2026-06-22T10:00:00.000Z'),
  description: 'A description',
  id,
  status: 'active',
  title: `Item ${id}`
})

describe('ItemsListCard', () => {
  test('renders the list title and item count', () => {
    const items = [makeItem('1'), makeItem('2')]
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemsListCard
          isLoading={false}
          items={items}
          onSearchChange={() => {}}
          search=""
        />
      </NextIntlClientProvider>
    )
    expect(screen.getByText('Items')).toBeInTheDocument()
    expect(screen.getByText('2 results')).toBeInTheDocument()
  })

  test('renders empty state when items list is empty', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemsListCard
          isLoading={false}
          items={[]}
          onSearchChange={() => {}}
          search=""
        />
      </NextIntlClientProvider>
    )
    expect(screen.getByText('No items found.')).toBeInTheDocument()
  })

  test('shows the error state and no result count when the items failed to load', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemsListCard
          isError
          isLoading={false}
          items={[]}
          onSearchChange={() => {}}
          search=""
        />
      </NextIntlClientProvider>
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      messages.components.errorState.title
    )
    expect(screen.getByText('Items')).toBeInTheDocument()
    expect(screen.queryByText('0 results')).not.toBeInTheDocument()
    expect(screen.queryByText(/results/)).not.toBeInTheDocument()
  })

  test('renders skeleton rows when loading', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemsListCard
          isLoading
          items={[]}
          onSearchChange={() => {}}
          search=""
        />
      </NextIntlClientProvider>
    )
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0)
  })

  test('renders the search bar', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemsListCard
          isLoading={false}
          items={[]}
          onSearchChange={() => {}}
          search=""
        />
      </NextIntlClientProvider>
    )
    expect(
      screen.getByRole('searchbox', { name: 'Search items' })
    ).toBeInTheDocument()
  })
})
