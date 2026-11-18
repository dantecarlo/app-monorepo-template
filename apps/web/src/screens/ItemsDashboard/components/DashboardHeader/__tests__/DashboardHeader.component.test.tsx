import { describe, expect, test } from 'vitest'

import { AppI18nProvider } from '@/lib/i18n/AppI18nProvider.component'
import { DashboardHeader } from '@/screens/ItemsDashboard/components/DashboardHeader/DashboardHeader.component'
import { withCopy } from '@/test/intl.helper'
import { render, screen } from '@/test/test.helper'

const messages = {
  app: {
    name: 'Acme'
  },
  items: {
    dashboard: {
      settingsLabel: 'Settings',
      title: 'Dashboard',
      welcomeBack: 'Welcome back'
    }
  }
}

describe('DashboardHeader', () => {
  test('renders the wordmark and settings button', () => {
    render(
      <AppI18nProvider locale="en" messages={withCopy({ copy: messages })}>
        <DashboardHeader />
      </AppI18nProvider>
    )
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByLabelText('Acme')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Settings' })
    ).toBeInTheDocument()
  })
})
