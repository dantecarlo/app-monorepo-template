import { ThemeEnum, themes } from '@app/tokens'
import { afterEach, describe, expect, test } from 'vitest'

import { Screen } from '@/components/ui/Screen/Screen.component'
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

const surfaceOf = (text: string) =>
  host(screen.getByText(text)).parentElement

describe('Screen', () => {
  afterEach(() => {
    applyTheme({ theme: ThemeEnum.DARK })
  })

  test("paints the active theme's base background", () => {
    applyTheme({ theme: ThemeEnum.LIGHT })
    render(
      <>
        <Screen>
          <span>plain</span>
        </Screen>
        <Screen style={{ justifyContent: 'center' }}>
          <span>centred</span>
        </Screen>
      </>
    )

    expect(styleOf(surfaceOf('plain'))).toEqual({
      backgroundColor: themes.light.bg.base,
      flex: 1
    })
    expect(styleOf(surfaceOf('centred'))).toEqual({
      backgroundColor: themes.light.bg.base,
      flex: 1,
      justifyContent: 'center'
    })
  })
})
