const noop = () => null
const passThrough = ({ children }: { children?: unknown }) =>
  children ?? null

export default passThrough
export const Circle = noop
export const Path = noop
export const Rect = noop
export const Svg = passThrough
