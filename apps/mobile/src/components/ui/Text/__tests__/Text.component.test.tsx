import { colors, fontFamily, fontSize, themes } from '@app/tokens'
import { colorScheme } from 'nativewind'
import { afterEach, describe, expect, test } from 'vitest'

import { Text } from '@/components/ui/Text/Text.component'
import { render, screen } from '@/test/test.helper'

// The mobile tests run without the DOM lib: this is the part of a rendered
// host element they read.
interface IHostNode {
  children: ArrayLike<IHostNode>
  firstElementChild: IHostNode | null
  getAttribute: (name: string) => string | null
  parentElement: IHostNode | null
}

const host = (node: unknown) => node as IHostNode

const styleOf = (node: unknown) =>
  JSON.parse(host(node).getAttribute('data-style') ?? '{}')

describe('Text', () => {
  afterEach(() => {
    colorScheme.set('dark')
  })

  test("renders a variant's typography", () => {
    render(<Text variant="caption">Updated</Text>)

    expect(styleOf(screen.getByText('Updated'))).toEqual({
      color: colors.text.tertiary,
      fontFamily: `${fontFamily.body}_400Regular`,
      fontSize: fontSize.caption.size,
      lineHeight: fontSize.caption.lineHeight
    })
  })

  test('lays a style over the variant, and renders no variant by default', () => {
    render(
      <>
        <Text style={{ marginTop: 4 }} variant="title">
          Items
        </Text>
        <Text style={{ color: colors.accentInk }}>A</Text>
      </>
    )

    expect(styleOf(screen.getByText('Items'))).toEqual({
      color: colors.text.primary,
      fontFamily: `${fontFamily.display}_600SemiBold`,
      fontSize: fontSize.title.size,
      lineHeight: fontSize.title.lineHeight,
      marginTop: 4
    })
    expect(styleOf(screen.getByText('A'))).toEqual({
      color: colors.accentInk
    })
  })

  test("paints a variant in the active theme's colour", () => {
    colorScheme.set('light')
    render(<Text variant="caption">Updated</Text>)

    expect(styleOf(screen.getByText('Updated'))).toEqual({
      color: themes.light.text.tertiary,
      fontFamily: `${fontFamily.body}_400Regular`,
      fontSize: fontSize.caption.size,
      lineHeight: fontSize.caption.lineHeight
    })
  })
})
