import { describe, expect, test } from 'vitest'

import { Toggle } from '@/components/ui/Toggle/Toggle.component'
import { GRADIENT_COLORS } from '@/components/ui/Toggle/Toggle.style'
import { render, screen } from '@/test/test.helper'

// The mobile tests run without the DOM lib: this is the part of a rendered
// host element they read.
interface IHostNode {
  firstElementChild: IHostNode | null
  getAttribute: (name: string) => string | null
}

const trackColorsOf = (node: unknown) =>
  (node as IHostNode).firstElementChild?.getAttribute('data-colors') ??
  null

describe('Toggle', () => {
  test('is exported as a function', () => {
    expect(typeof Toggle).toBe('function')
  })

  test('paints its track with the accent gradient only while on', () => {
    render(
      <>
        <Toggle
          accessibilityLabel="On"
          onValueChange={() => undefined}
          value
        />
        <Toggle
          accessibilityLabel="Off"
          onValueChange={() => undefined}
          value={false}
        />
      </>
    )

    expect(
      JSON.parse(
        trackColorsOf(screen.getByRole('switch', { name: 'On' })) ?? '[]'
      )
    ).toEqual(GRADIENT_COLORS)
    expect(
      trackColorsOf(screen.getByRole('switch', { name: 'Off' }))
    ).toBeNull()
  })
})
