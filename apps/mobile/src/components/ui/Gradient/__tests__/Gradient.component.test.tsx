import type { ReactNode } from 'react'
import { describe, expect, test, vi } from 'vitest'

import { render, screen } from '@/test/test.helper'

// Every prop the gradient primitive receives, as JSON, so the test reads what
// the block handed it.
vi.mock('expo-linear-gradient', async () => {
  const { createElement } = await import('react')
  return {
    LinearGradient: ({
      children,
      ...props
    }: {
      accessibilityLabel?: string
      children?: ReactNode
    }) =>
      createElement(
        'div',
        {
          'aria-label': props.accessibilityLabel,
          'data-props': JSON.stringify(props)
        },
        children
      )
  }
})

import { Gradient } from '@/components/ui/Gradient/Gradient.component'

interface IHostNode {
  getAttribute: (name: string) => string | null
  parentElement: IHostNode | null
}

const host = (node: unknown) => node as IHostNode

describe('Gradient', () => {
  test('hands its stops, its direction and its style to the gradient, behind its children', () => {
    render(
      <Gradient
        accessibilityLabel="Badge"
        colors={['#000000', '#FFFFFF']}
        end={{ x: 1, y: 0 }}
        start={{ x: 0, y: 0 }}
        style={{ height: 10 }}
      >
        <span>T</span>
      </Gradient>
    )
    const gradient = screen.getByLabelText('Badge')

    expect(
      JSON.parse(host(gradient).getAttribute('data-props') ?? '{}')
    ).toEqual({
      accessibilityLabel: 'Badge',
      colors: ['#000000', '#FFFFFF'],
      end: { x: 1, y: 0 },
      start: { x: 0, y: 0 },
      style: { height: 10 }
    })
    expect(host(screen.getByText('T')).parentElement).toBe(gradient)
  })
})
