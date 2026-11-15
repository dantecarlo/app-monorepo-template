import { colors, fontSize, spacing } from '@app/tokens'
import { describe, expect, test } from 'vitest'

import { Divider } from '@/components/ui/Divider/Divider.component'
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

const HAIRLINE_RULE = {
  backgroundColor: colors.divider,
  flex: 1,
  height: 1
}

describe('Divider', () => {
  test('renders the label between two rules', () => {
    const { container } = render(
      <Divider label="or" style={{ marginVertical: spacing.lg }} />
    )
    const root = host(container).firstElementChild as IHostNode
    const [before, label, after] = Array.from(root.children)

    expect(styleOf(root)).toEqual({
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.md,
      marginVertical: spacing.lg
    })
    expect(label).toBe(screen.getByText('or'))
    expect(styleOf(label)).toMatchObject({
      color: colors.text.tertiary,
      fontSize: fontSize.caption.size
    })
    expect(styleOf(before)).toEqual(HAIRLINE_RULE)
    expect(styleOf(after)).toEqual(HAIRLINE_RULE)
  })

  test('renders a single rule without a label', () => {
    const { container } = render(<Divider />)
    const root = host(container).firstElementChild as IHostNode

    expect(root.children).toHaveLength(1)
    expect(styleOf(root.children[0])).toEqual(HAIRLINE_RULE)
  })
})
