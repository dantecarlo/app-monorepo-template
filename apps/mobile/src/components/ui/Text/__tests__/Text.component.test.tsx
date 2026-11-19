import {
  colors,
  fontFamily,
  fontSize,
  ThemeEnum,
  themes
} from '@app/tokens'
import { createElement } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'

// Every prop the native text receives, kept as it renders through the
// stand-in, so a test reads what the block handed it. The Text block is the
// one wrapper of react-native's Text, so only its own test stands in for it.
const { nativeTextProps } = vi.hoisted(() => ({
  nativeTextProps: [] as Array<Record<string, unknown>>
}))

vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native')>()
  return {
    ...actual,
    Text: (props: Record<string, unknown>) => {
      nativeTextProps.push(props)
      return createElement(actual.Text, props)
    }
  }
})

import { Text } from '@/components/ui/Text/Text.component'
import { applyTheme } from '@/lib/theme/colorScheme.adapter'
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
    applyTheme({ theme: ThemeEnum.DARK })
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
    applyTheme({ theme: ThemeEnum.LIGHT })
    render(<Text variant="caption">Updated</Text>)

    expect(styleOf(screen.getByText('Updated'))).toEqual({
      color: themes.light.text.tertiary,
      fontFamily: `${fontFamily.body}_400Regular`,
      fontSize: fontSize.caption.size,
      lineHeight: fontSize.caption.lineHeight
    })
  })

  test('hands its accessibility role to the native text', () => {
    render(
      <>
        <Text accessibilityRole="header" variant="title">
          Items
        </Text>
        <Text>Updated</Text>
      </>
    )

    expect(screen.getByRole('header')).toBe(screen.getByText('Items'))
    expect(
      host(screen.getByText('Updated')).getAttribute('role')
    ).toBeNull()
  })

  test('hands the classes a block sets to the native text', () => {
    nativeTextProps.length = 0
    render(
      <>
        <Text className="font-bold text-accent-ink">Go</Text>
        <Text>Stop</Text>
      </>
    )

    const propsOf = (children: string) =>
      nativeTextProps.find((props) => props['children'] === children)

    expect(propsOf('Go')?.['className']).toBe('font-bold text-accent-ink')
    expect(propsOf('Stop')?.['className']).toBeUndefined()
  })
})
