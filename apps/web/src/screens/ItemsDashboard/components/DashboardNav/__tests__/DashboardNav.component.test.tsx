import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test } from 'vitest'

import { DashboardNav } from '@/screens/ItemsDashboard/components/DashboardNav/DashboardNav.component'
import { render, screen } from '@/test/test.helper'

const messages = {
  items: {
    dashboard: {
      nav: {
        ariaLabel: 'Main navigation',
        home: 'Home',
        items: 'Items',
        search: 'Search',
        settings: 'Settings'
      }
    }
  }
}

describe('DashboardNav', () => {
  test('renders all nav items', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <DashboardNav activeId="home" onItemPress={() => {}} />
      </NextIntlClientProvider>
    )
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Items')).toBeInTheDocument()
    expect(screen.getByText('Search')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  test('marks the active item as selected', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <DashboardNav activeId="home" onItemPress={() => {}} />
      </NextIntlClientProvider>
    )
    const homeTab = screen.getByRole('tab', { name: 'Home' })
    expect(homeTab).toHaveAttribute('aria-selected', 'true')
  })
})
