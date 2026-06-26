import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import React from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { MOCK_ITEM_DTOS } from '@/test/mocks/items.mock'
import { render, screen, waitFor } from '@/test/test.helper'

const { mockGetItems } = vi.hoisted(() => ({
  mockGetItems: vi.fn()
}))

vi.mock('@/services/Items', async (importActual) => {
  const actual = await importActual<typeof import('@/services/Items')>()
  return { ...actual, getItems: mockGetItems }
})

import { ItemsDashboardScreen } from '@/screens/ItemsDashboard/ItemsDashboard.screen'

const messages = {
  app: {
    name: 'Acme'
  },
  components: {
    emptyState: {
      message: 'There is nothing here yet.',
      title: 'No results'
    }
  },
  items: {
    dashboard: {
      listEmpty: 'No items found.',
      listResults: '{count} results',
      listTitle: 'Items',
      nav: {
        ariaLabel: 'Main navigation',
        home: 'Home',
        items: 'Items',
        search: 'Search',
        settings: 'Settings'
      },
      searchLabel: 'Search items',
      searchPlaceholder: 'Search items…',
      settingsLabel: 'Settings',
      statsActive: 'active',
      statsLive: 'Live',
      statsOverview: 'Overview',
      statsTotalItems: 'total items',
      statsUpdated: 'updated just now',
      title: 'Dashboard',
      viewAll: 'View all items',
      welcomeBack: 'Welcome back'
    }
  }
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={messages}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  )
  return Wrapper
}

describe('ItemsDashboardScreen', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('renders the dashboard header', async () => {
    mockGetItems.mockResolvedValue(MOCK_ITEM_DTOS)
    render(<ItemsDashboardScreen />, { wrapper: createWrapper() })
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  test('renders the nav bar', async () => {
    mockGetItems.mockResolvedValue(MOCK_ITEM_DTOS)
    render(<ItemsDashboardScreen />, { wrapper: createWrapper() })
    expect(
      screen.getByRole('navigation', { name: 'Main navigation' })
    ).toBeInTheDocument()
  })

  test('shows loading skeletons while fetching', () => {
    mockGetItems.mockReturnValue(new Promise(() => {}))
    render(<ItemsDashboardScreen />, { wrapper: createWrapper() })
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0)
  })

  test('renders item list after loading', async () => {
    mockGetItems.mockResolvedValue(MOCK_ITEM_DTOS)
    render(<ItemsDashboardScreen />, { wrapper: createWrapper() })
    await waitFor(() =>
      expect(
        screen.getByText('Improve onboarding flow')
      ).toBeInTheDocument()
    )
  })

  test('renders the view all button', async () => {
    mockGetItems.mockResolvedValue(MOCK_ITEM_DTOS)
    render(<ItemsDashboardScreen />, { wrapper: createWrapper() })
    expect(
      screen.getByRole('button', { name: 'View all items' })
    ).toBeInTheDocument()
  })

  test('shows empty-state message when items query returns an empty array', async () => {
    mockGetItems.mockResolvedValue([])
    render(<ItemsDashboardScreen />, { wrapper: createWrapper() })
    await waitFor(() =>
      expect(screen.getByText('No items found.')).toBeInTheDocument()
    )
  })
})
