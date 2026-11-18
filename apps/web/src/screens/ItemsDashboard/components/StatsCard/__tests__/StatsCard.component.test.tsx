import { describe, expect, test } from 'vitest'

import { AppI18nProvider } from '@/lib/i18n/AppI18nProvider.component'
import { StatsCard } from '@/screens/ItemsDashboard/components/StatsCard/StatsCard.component'
import { withCopy } from '@/test/intl.helper'
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
      <AppI18nProvider locale="en" messages={withCopy({ copy: messages })}>
        <StatsCard activeCount={3} isLoading={false} totalCount={10} />
      </AppI18nProvider>
    )
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('total items')).toBeInTheDocument()
  })

  test('shows dash placeholder when loading', () => {
    render(
      <AppI18nProvider locale="en" messages={withCopy({ copy: messages })}>
        <StatsCard activeCount={0} isLoading totalCount={0} />
      </AppI18nProvider>
    )
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})
