import { describe, expect, test, vi } from 'vitest'

vi.mock('@/lib/i18n/useAppTranslator.hook', () => ({
  useAppTranslator: () => ({
    has: () => false,
    locale: 'en',
    t: (key: string) => key
  })
}))

vi.mock('@/components/ui/NavBar', () => ({
  NavBar: () => null
}))

import { DashboardNav } from '@/screens/ItemsDashboard/components/DashboardNav/DashboardNav.component'

describe('DashboardNav (mobile)', () => {
  test('renders without returning null', () => {
    const result = DashboardNav({
      activeId: 'home',
      onItemPress: () => undefined
    })
    expect(result).not.toBeNull()
  })
})
