import { createElement, type ReactNode } from 'react'

const noop = () => null
const passThrough = ({ children }: { children?: unknown }) =>
  children ?? null

interface IHostProps {
  accessibilityLabel?: string
  accessibilityRole?: string
  children?: ReactNode
  onPress?: () => void
}

// Renders a host component as a DOM element that keeps its accessibility role,
// its label and its press handler, so a test can query it by role and press it.
const host =
  (tag: string) =>
  ({
    accessibilityLabel,
    accessibilityRole,
    children,
    onPress
  }: IHostProps) =>
    createElement(
      tag,
      {
        'aria-label': accessibilityLabel,
        onClick: onPress,
        role: accessibilityRole
      },
      children
    )

export const ActivityIndicator = noop
export const Appearance = {
  addChangeListener: () => ({ remove: noop }),
  getColorScheme: () => 'dark' as const
}
export const Platform = {
  OS: 'web',
  select: (map: Record<string, unknown>) => map['default'] ?? map['web']
}
export const Pressable = host('button')
export const StyleSheet = { create: (s: unknown) => s, hairlineWidth: 1 }
export const Text = host('span')
export const TextInput = passThrough
export const View = host('div')

const animatedValue = (initial: number) => ({
  _value: initial,
  interpolate: () => animatedValue(0),
  setValue: noop
})

export const Animated = {
  Value: function (initial: number) {
    return animatedValue(initial)
  },
  View: passThrough,
  timing: () => ({ start: noop })
}
