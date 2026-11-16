import { createElement, type ReactNode } from 'react'

const noop = () => null
const passThrough = ({ children }: { children?: unknown }) =>
  children ?? null

interface IHostProps {
  accessibilityLabel?: string
  accessibilityRole?: string
  children?: ReactNode
  onPress?: () => void
  style?: unknown
}

// A React Native style prop, flattened as StyleSheet.flatten would: nested
// arrays merge left to right and falsy entries drop out. A style function
// (Pressable's) is not called.
export const flattenStyle = (style: unknown): Record<string, unknown> => {
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.map(flattenStyle))
  }
  return style && typeof style === 'object'
    ? (style as Record<string, unknown>)
    : {}
}

// Renders a host component as a DOM element that keeps its accessibility role,
// its label and its press handler, so a test can query it by role and press it,
// and its flattened style as `data-style` JSON, so a test can read what it paints.
const host =
  (tag: string) =>
  ({
    accessibilityLabel,
    accessibilityRole,
    children,
    onPress,
    style
  }: IHostProps) =>
    createElement(
      tag,
      {
        'aria-label': accessibilityLabel,
        'data-style': JSON.stringify(flattenStyle(style)),
        onClick: onPress,
        role: accessibilityRole
      },
      children
    )

// A spinner keeps its accessibility label, so a test can find a busy control.
export const ActivityIndicator = host('span')
export const Appearance = {
  addChangeListener: () => ({ remove: noop }),
  getColorScheme: () => 'dark' as const
}
export const Platform = {
  OS: 'web',
  select: (map: Record<string, unknown>) => map['default'] ?? map['web']
}
export const Pressable = host('button')
export const SafeAreaView = host('div')
export const ScrollView = host('div')
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
