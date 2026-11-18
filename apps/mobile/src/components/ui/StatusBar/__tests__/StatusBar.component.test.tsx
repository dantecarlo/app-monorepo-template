import type { ReactNode } from 'react'
import { describe, expect, expectTypeOf, test, vi } from 'vitest'

import { render, screen } from '@/test/test.helper'

// Every prop the status bar primitive receives, as JSON, so the test reads
// what the block handed it.
vi.mock('expo-status-bar', async () => {
  const { createElement } = await import('react')
  return {
    StatusBar: (props: { children?: ReactNode }) =>
      createElement('div', {
        'aria-label': 'status bar',
        'data-props': JSON.stringify(props)
      })
  }
})

import { StatusBar } from '@/components/ui/StatusBar/StatusBar.component'
import type {
  IStatusBarProps,
  StatusBarStyleType
} from '@/components/ui/StatusBar/StatusBar.type'

interface IHostNode {
  getAttribute: (name: string) => string | null
}

const propsOf = (node: unknown) =>
  JSON.parse((node as IHostNode).getAttribute('data-props') ?? '{}')

describe('StatusBar', () => {
  test('sets the status bar to the glyph style it is given', () => {
    render(
      <>
        <StatusBar style="dark" />
        <StatusBar style="light" />
      </>
    )

    expect(screen.getAllByLabelText('status bar').map(propsOf)).toEqual([
      { style: 'dark' },
      { style: 'light' }
    ])
  })

  test('takes its own glyph style', () => {
    expectTypeOf<
      IStatusBarProps['style']
    >().toEqualTypeOf<StatusBarStyleType>()
    expectTypeOf<StatusBarStyleType>().toEqualTypeOf<'dark' | 'light'>()
  })
})
