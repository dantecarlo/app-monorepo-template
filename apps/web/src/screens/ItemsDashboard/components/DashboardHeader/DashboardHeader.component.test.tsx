import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test } from 'vitest'

import { DashboardHeader } from '@/screens/ItemsDashboard/components/DashboardHeader/DashboardHeader.component'
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
      <NextIntlClientProvider locale="en" messages={messages}>
        <DashboardHeader />
      </NextIntlClientProvider>
    )
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByLabelText('Acme')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Settings' })
    ).toBeInTheDocument()
  })
})
