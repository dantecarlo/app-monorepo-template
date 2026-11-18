import { describe, expect, test, vi } from 'vitest'
import { axe } from 'vitest-axe'

import { Image } from '@/components/ui/Image/Image.component'
import { fireEvent, render, screen } from '@/test/test.helper'

describe('Image', () => {
  test('renders its source at its size under its alternative text', () => {
    render(
      <Image alt="Acme logo" height={48} src="/logo.svg" width={64} />
    )

    const image = screen.getByRole('img', { name: 'Acme logo' })
    expect(image).toHaveAttribute('width', '64')
    expect(image).toHaveAttribute('height', '48')
    expect(image.getAttribute('src')).toMatch(/\/logo\.svg$/)
  })

  test('has no accessibility violations', async () => {
    const { container } = render(
      <Image alt="Acme logo" height={48} src="/logo.svg" width={64} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  test('calls its error handler when the image fails to load', () => {
    const onError = vi.fn()
    render(
      <Image
        alt="Acme logo"
        height={48}
        onError={onError}
        src="/logo.svg"
        width={64}
      />
    )

    fireEvent.error(screen.getByRole('img', { name: 'Acme logo' }))

    expect(onError).toHaveBeenCalledOnce()
  })

  test('loads a priority image eagerly and any other lazily', () => {
    render(
      <>
        <Image
          alt="Hero"
          height={48}
          priority
          src="/hero.svg"
          width={64}
        />
        <Image alt="Thumbnail" height={48} src="/thumb.svg" width={64} />
      </>
    )

    expect(screen.getByRole('img', { name: 'Hero' })).not.toHaveAttribute(
      'loading'
    )
    expect(screen.getByRole('img', { name: 'Thumbnail' })).toHaveAttribute(
      'loading',
      'lazy'
    )
  })
})
