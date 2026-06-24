import { describe, expect, test, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: unknown }) => children
}))

vi.mock('@/components/ui/IconButton', () => ({
  IconButton: () => null
}))

import { DashboardHeader } from './DashboardHeader.component'

describe('DashboardHeader (mobile)', () => {
  test('renders without returning null', () => {
    const result = DashboardHeader()
    expect(result).not.toBeNull()
  })
})
