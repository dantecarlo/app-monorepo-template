import { colors } from '@app/tokens'
import { describe, expect, test } from 'vitest'

import { AccentGradient } from '@/components/ui/AccentGradient/AccentGradient.component'
import { render, screen } from '@/test/test.helper'

describe('AccentGradient', () => {
  test('paints the accent gradient behind its children', () => {
    render(
      <AccentGradient accessibilityLabel="Template">
        <span>T</span>
      </AccentGradient>
    )
    const gradient = screen.getByLabelText('Template')
    const colorsOf = (node: unknown) =>
      JSON.parse(
        (
          node as { getAttribute: (name: string) => string | null }
        ).getAttribute('data-colors') ?? '[]'
      )

    expect(colorsOf(gradient)).toEqual([colors.accentLight, colors.accent])
    expect(
      (screen.getByText('T') as unknown as { parentElement: unknown })
        .parentElement
    ).toBe(gradient)
  })
})
