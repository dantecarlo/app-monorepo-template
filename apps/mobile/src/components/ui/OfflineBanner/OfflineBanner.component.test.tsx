import { describe, expect, test, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

import { OfflineBanner } from './OfflineBanner.component'

describe('OfflineBanner (mobile)', () => {
  test('renders null when isOffline is false', () => {
    const result = OfflineBanner({ isOffline: false })
    expect(result).toBeNull()
  })

  test('renders the banner when isOffline is true', () => {
    const result = OfflineBanner({ isOffline: true })
    expect(result).not.toBeNull()
  })
})
