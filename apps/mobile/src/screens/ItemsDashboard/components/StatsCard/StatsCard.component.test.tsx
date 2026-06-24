import { describe, expect, test, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

vi.mock('@/components/ui/GlassCard', () => ({
  GlassCard: ({ children }: { children?: unknown }) => children
}))

import { StatsCard } from './StatsCard.component'

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
})
