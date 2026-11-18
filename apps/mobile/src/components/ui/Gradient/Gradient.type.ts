import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'

/** A point of the surface, from 0 to 1 on each axis: { x: 0, y: 0 } is its top left. */
export interface IGradientPoint {
  x: number
  y: number
}

export interface IGradientProps {
  accessibilityLabel?: string
  children?: ReactNode
  /** The colour stops, from the start point to the end point; at least two. */
  colors: readonly [string, string, ...string[]]
  /** Where the last stop sits; the bottom centre by default. */
  end?: IGradientPoint
  /** Where the first stop sits; the top centre by default. */
  start?: IGradientPoint
  /** The shape of the surface: size, radius and position. */
  style?: StyleProp<ViewStyle>
}
