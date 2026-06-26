import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key
}))

const cycleLanguage = vi.fn()

vi.mock(
  '@/components/ui/LanguageSwitcher/useLanguageSwitcher.hook',
  () => ({
    useLanguageSwitcher: () => ({ cycleLanguage, locale: 'en' })
  })
)

import { LanguageSwitcher } from './LanguageSwitcher.component'

describe('LanguageSwitcher', () => {
  test('renders the active locale label', () => {
    render(<LanguageSwitcher />)
    expect(screen.getByRole('button').textContent).toBe('en')
  })

  test('cycles the language on click', () => {
    render(<LanguageSwitcher />)
    fireEvent.click(screen.getByRole('button'))
    expect(cycleLanguage).toHaveBeenCalledTimes(1)
  })

  test('uses the provided accessibility label', () => {
    render(<LanguageSwitcher accessibilityLabel="Language" />)
    expect(screen.getByLabelText('Language')).toBeTruthy()
  })
})
