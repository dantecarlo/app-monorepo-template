import { describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

import { OfflineBanner } from './OfflineBanner.component'

describe('OfflineBanner (mobile)', () => {
  it('renders null when isOffline is false', () => {
    const result = OfflineBanner({ isOffline: false })
    expect(result).toBeNull()
  })

  it('renders the banner when isOffline is true', () => {
    const result = OfflineBanner({ isOffline: true })
    expect(result).not.toBeNull()
  })
})
