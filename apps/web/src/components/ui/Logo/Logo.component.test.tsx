import { fireEvent, render, screen } from '@testing-library/react'
import type { ImgHTMLAttributes } from 'react'
import { describe, expect, test, vi } from 'vitest'

vi.mock('next-intl', () => ({
  // eslint-disable-next-line local/single-object-params -- mirrors next-intl's t(key, values) callback shape
  useTranslations: () => (key: string, values?: Record<string, string>) =>
    values?.name ? `${values.name} ${key}` : key
}))

vi.mock('next/image', () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element -- test stub mirroring next/image
    <img {...props} />
  )
}))

import { Logo } from './Logo.component'

describe('Logo', () => {
  test('renders the asset slot image by default', () => {
    render(<Logo brandLabel="Acme" />)
    expect(screen.getByRole('img')).toBeTruthy()
  })

  test('labels the asset with the brand name', () => {
    render(<Logo brandLabel="Acme" />)
    expect(screen.getByAltText('Acme label')).toBeTruthy()
  })

  test('falls back to the brand wordmark when the asset errors', () => {
    render(<Logo brandLabel="Acme" />)
    fireEvent.error(screen.getByRole('img'))
    expect(screen.getByText('Acme')).toBeTruthy()
  })
})
