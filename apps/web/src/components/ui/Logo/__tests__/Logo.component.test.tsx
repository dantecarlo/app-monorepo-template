import { fireEvent, render, screen } from '@testing-library/react'
import type { ImgHTMLAttributes } from 'react'
import { describe, expect, test, vi } from 'vitest'

vi.mock('@/lib/i18n/useAppTranslator.hook', () => ({
  useAppTranslator: () => ({
    has: () => false,
    locale: 'en',
    t: (...[key, values]: [string, Record<string, string>?]) =>
      values?.name ? `${values.name} ${key}` : key
  })
}))

vi.mock('@/components/ui/Image/Image.component', () => ({
  Image: (props: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element -- test stub mirroring the ui Image block
    <img {...props} />
  )
}))

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
