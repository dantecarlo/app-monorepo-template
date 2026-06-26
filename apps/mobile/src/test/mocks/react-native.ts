const noop = () => null
const passThrough = ({ children }: { children?: unknown }) =>
  children ?? null

export const ActivityIndicator = noop
export const Appearance = {
  addChangeListener: () => ({ remove: noop }),
  getColorScheme: () => 'dark' as const
}
export const Platform = {
  OS: 'web',
  select: (map: Record<string, unknown>) => map['default'] ?? map['web']
}
export const Pressable = passThrough
export const StyleSheet = { create: (s: unknown) => s, hairlineWidth: 1 }
export const Text = passThrough
export const TextInput = passThrough
export const View = passThrough

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
