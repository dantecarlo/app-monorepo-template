import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key
}))

vi.mock('@/components/ui/OfflineBanner/useOnlineStatus.hook', () => ({
  useOnlineStatus: () => true
}))

import { OfflineBanner } from './OfflineBanner.component'

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
