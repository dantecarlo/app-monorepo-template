import { describe, expect, test, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

vi.mock('@/components/ui/NavBar', () => ({
  NavBar: () => null
}))

import { DashboardNav } from './DashboardNav.component'

describe('DashboardNav (mobile)', () => {
  test('renders without returning null', () => {
    const result = DashboardNav({
      activeId: 'home',
      onItemPress: () => undefined
    })
    expect(result).not.toBeNull()
  })
})
