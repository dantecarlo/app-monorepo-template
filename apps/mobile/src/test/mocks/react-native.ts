const noop = () => null
const passThrough = ({ children }: { children?: unknown }) =>
  children ?? null

export const ActivityIndicator = noop
export const Pressable = passThrough
export const StyleSheet = { create: (s: unknown) => s }
export const Text = passThrough
export const View = passThrough
