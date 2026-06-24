import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test } from 'vitest'

import { StatsCard } from '@/screens/ItemsDashboard/components/StatsCard/StatsCard.component'
import { render, screen } from '@/test/test.helper'

const messages = {
  items: {
    dashboard: {
      statsActive: 'active',
      statsLive: 'Live',
      statsOverview: 'Overview',
      statsTotalItems: 'total items',
      statsUpdated: 'updated just now'
    }
  }
}

describe('StatsCard', () => {
  test('renders stats when not loading', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <StatsCard activeCount={3} isLoading={false} totalCount={10} />
      </NextIntlClientProvider>
    )
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('total items')).toBeInTheDocument()
  })

  test('shows dash placeholder when loading', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <StatsCard activeCount={0} isLoading totalCount={0} />
      </NextIntlClientProvider>
    )
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})
