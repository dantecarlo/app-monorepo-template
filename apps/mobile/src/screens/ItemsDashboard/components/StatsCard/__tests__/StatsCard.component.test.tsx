import { describe, expect, test, vi } from 'vitest'

import { render, screen } from '@/test/test.helper'

vi.mock('@/lib/i18n/useAppTranslator.hook', () => ({
  useAppTranslator: () => ({
    has: () => false,
    locale: 'en',
    t: (key: string) => key
  })
}))

vi.mock('@/components/ui/GlassCard', () => ({
  GlassCard: ({ children }: { children?: unknown }) => children
}))

import { StatsCard } from '@/screens/ItemsDashboard/components/StatsCard/StatsCard.component'

describe('StatsCard (mobile)', () => {
  test('renders without returning null when loading', () => {
    const result = StatsCard({
      activeCount: 0,
      isLoading: true,
      totalCount: 0
    })
    expect(result).not.toBeNull()
  })

  test('renders without returning null with data', () => {
    const result = StatsCard({
      activeCount: 3,
      isLoading: false,
      totalCount: 10
    })
    expect(result).not.toBeNull()
  })

  test('shows the total and the active count once the items have loaded', () => {
    render(<StatsCard activeCount={3} isLoading={false} totalCount={10} />)

    expect(screen.getByText('10')).toBeTruthy()
    expect(
      screen.getByText('items.dashboard.statsTotalItems')
    ).toBeTruthy()
    expect(screen.getByText('3 items.dashboard.statsActive')).toBeTruthy()
    expect(screen.queryByText('—')).toBeNull()
  })

  test('shows a dash in place of each count while loading', () => {
    render(<StatsCard activeCount={3} isLoading totalCount={10} />)

    expect(screen.getByText('—')).toBeTruthy()
    expect(screen.getByText('— items.dashboard.statsActive')).toBeTruthy()
    expect(screen.queryByText('10')).toBeNull()
    expect(screen.queryByText(/^3/)).toBeNull()
  })

  test('shows no total and no active count when the items failed to load', () => {
    render(
      <StatsCard
        activeCount={0}
        isError
        isLoading={false}
        totalCount={0}
      />
    )

    expect(screen.getByText('items.dashboard.statsOverview')).toBeTruthy()
    expect(screen.getByText('items.dashboard.statsLive')).toBeTruthy()
    expect(screen.queryByText('0')).toBeNull()
    expect(screen.queryByText(/—/)).toBeNull()
    expect(
      screen.queryByText('items.dashboard.statsTotalItems')
    ).toBeNull()
    expect(screen.queryByText(/statsActive/)).toBeNull()
    expect(screen.queryByText(/statsUpdated/)).toBeNull()
  })
})
