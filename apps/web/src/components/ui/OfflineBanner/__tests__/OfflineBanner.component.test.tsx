import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

vi.mock('@/lib/i18n/useAppTranslator.hook', () => ({
  useAppTranslator: () => ({
    has: () => false,
    locale: 'en',
    t: (key: string) => key
  })
}))

vi.mock('@/components/ui/OfflineBanner/useOnlineStatus.hook', () => ({
  useOnlineStatus: () => true
}))

import { OfflineBanner } from '@/components/ui/OfflineBanner/OfflineBanner.component'

describe('OfflineBanner', () => {
  test('renders nothing when online', () => {
    const { container } = render(<OfflineBanner />)
    expect(container.firstChild).toBeNull()
  })

  test('renders the banner when forceOffline is true', () => {
    render(<OfflineBanner forceOffline={true} />)
    expect(screen.getByRole('status')).toBeDefined()
  })
})
