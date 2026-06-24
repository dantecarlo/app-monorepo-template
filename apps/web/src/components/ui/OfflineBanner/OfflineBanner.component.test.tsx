import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key
}))

vi.mock('@/components/ui/OfflineBanner/useOnlineStatus.hook', () => ({
  useOnlineStatus: () => true
}))

import { OfflineBanner } from './OfflineBanner.component'

describe('OfflineBanner', () => {
  it('renders nothing when online', () => {
    const { container } = render(<OfflineBanner />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the banner when forceOffline is true', () => {
    render(<OfflineBanner forceOffline={true} />)
    expect(screen.getByRole('status')).toBeDefined()
  })
})
