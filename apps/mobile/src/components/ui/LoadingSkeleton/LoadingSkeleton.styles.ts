import { colors, radius } from '@app/tokens'
import { StyleSheet } from 'react-native'

export const SKELETON_PLACEHOLDER_COLOR = colors.glass.fill
export const SKELETON_SHIMMER_START = 'transparent'
export const SKELETON_SHIMMER_MID = colors.glass.stroke
export const SKELETON_SHIMMER_END = 'transparent'

export const ROUNDED_BY_VARIANT = {
  full: radius.full,
  lg: radius.lg,
  md: radius.md,
  sm: radius.sm
} as const

export type SkeletonRoundedType = keyof typeof ROUNDED_BY_VARIANT

export const LOADING_SKELETON_STYLES = StyleSheet.create({
  root: {
    backgroundColor: SKELETON_PLACEHOLDER_COLOR,
    overflow: 'hidden'
  },
  shimmer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  }
})
