import { themes } from '@app/tokens'
import { colorScheme } from 'nativewind'
import { afterEach, describe, expect, test } from 'vitest'

import { Screen } from '@/components/ui/Screen/Screen.component'
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

const surfaceOf = (text: string) =>
  host(screen.getByText(text)).parentElement

describe('Screen', () => {
  afterEach(() => {
    colorScheme.set('dark')
  })

  test("paints the dark base, or the active theme's base when themed", () => {
    colorScheme.set('light')
    render(
      <>
        <Screen>
          <span>fixed</span>
        </Screen>
        <Screen style={{ justifyContent: 'center' }} themed>
          <span>themed</span>
        </Screen>
      </>
    )

    expect(styleOf(surfaceOf('fixed'))).toEqual({
      backgroundColor: themes.dark.bg.base,
      flex: 1
    })
    expect(styleOf(surfaceOf('themed'))).toEqual({
      backgroundColor: themes.light.bg.base,
      flex: 1,
      justifyContent: 'center'
    })
  })
})
