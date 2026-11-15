import { describe, expect, test } from 'vitest'
import { axe } from 'vitest-axe'

import { Screen } from '@/components/ui/Screen/Screen.component'
import { render, screen } from '@/test/test.helper'

describe('Screen', () => {
  test('paints the base background behind its children', () => {
    render(
      <Screen className="relative z-10">
        <p>Body</p>
      </Screen>
    )
    const surface = screen.getByText('Body').parentElement as HTMLElement

    expect(surface.className.split(' ').sort()).toEqual(
      ['bg-bg-base', 'min-h-screen', 'relative', 'z-10'].sort()
    )
  })

  test('has no accessibility violations', async () => {
    const { container } = render(
      <Screen>
        <p>Body</p>
      </Screen>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
