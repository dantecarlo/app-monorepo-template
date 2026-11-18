const noop = () => null
const passThrough = ({ children }: { children?: unknown }) =>
  children ?? null

export default passThrough
export const Circle = noop
export const Defs = noop
export const LinearGradient = noop
export const Path = noop
export const Rect = noop
export const Stop = noop
export const Svg = passThrough
