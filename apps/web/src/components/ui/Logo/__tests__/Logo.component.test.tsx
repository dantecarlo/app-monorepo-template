import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

vi.mock('@/lib/i18n/useAppTranslator.hook', () => ({
  useAppTranslator: () => ({
    has: () => false,
    locale: 'en',
    t: (...[key, values]: [string, Record<string, string>?]) =>
      values?.name ? `${values.name} ${key}` : key
  })
}))

// The asset renders through the ui Image block itself, as the app draws it.
import { Logo } from '@/components/ui/Logo/Logo.component'

describe('Logo', () => {
  test('renders the asset slot image by default', () => {
    render(<Logo brandLabel="Acme" />)
    expect(screen.getByRole('img')).toBeTruthy()
  })

  test('labels the asset with the brand name', () => {
    render(<Logo brandLabel="Acme" />)
    expect(screen.getByAltText('Acme auth.logo.label')).toBeTruthy()
  })

  test('falls back to the brand wordmark when the asset errors', () => {
    render(<Logo brandLabel="Acme" />)
    fireEvent.error(screen.getByRole('img'))
    expect(screen.getByText('Acme')).toBeTruthy()
  })
})
