import { describe, expect, test } from 'vitest'

import { AppI18nProvider } from '@/lib/i18n/AppI18nProvider.component'
import { DashboardNav } from '@/screens/ItemsDashboard/components/DashboardNav/DashboardNav.component'
import { withCopy } from '@/test/intl.helper'
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
      <AppI18nProvider locale="en" messages={withCopy({ copy: messages })}>
        <DashboardNav activeId="home" onItemPress={() => {}} />
      </AppI18nProvider>
    )
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Items')).toBeInTheDocument()
    expect(screen.getByText('Search')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  test('marks the active item as selected', () => {
    render(
      <AppI18nProvider locale="en" messages={withCopy({ copy: messages })}>
        <DashboardNav activeId="home" onItemPress={() => {}} />
      </AppI18nProvider>
    )
    const homeTab = screen.getByRole('tab', { name: 'Home' })
    expect(homeTab).toHaveAttribute('aria-selected', 'true')
  })
})
