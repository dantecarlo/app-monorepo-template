import { describe, expect, test, vi } from 'vitest'

import { render, screen } from '@/test/test.helper'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: unknown }) => children
}))

import { DashboardHeader } from '@/screens/ItemsDashboard/components/DashboardHeader/DashboardHeader.component'

describe('DashboardHeader (mobile)', () => {
  test('renders without returning null', () => {
    const result = DashboardHeader()
    expect(result).not.toBeNull()
  })

  test('shows no settings button', () => {
    render(<DashboardHeader />)

    expect(screen.getByText('welcomeBack')).toBeTruthy()
    expect(screen.getByText('title')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })
})
