import { radius } from '@app/tokens'
import { StyleSheet } from 'react-native'

import {
  createThemedStyles,
  createThemedValues
} from '@/lib/theme/createThemedStyles.helper'

export const SKELETON_SHIMMER_START = 'transparent'
export const SKELETON_SHIMMER_END = 'transparent'

// The highlight that sweeps across the placeholder, per theme.
export const SKELETON_SHIMMER_MID = createThemedValues({
  build: (palette) => palette.glass.stroke
})

export const SHIMMER_DURATION = 1200
export const SHIMMER_TRANSLATE_RANGE = 200
export const SHIMMER_START_VALUE = -1
export const SHIMMER_REPEAT_FOREVER = -1

export const ROUNDED_BY_VARIANT = {
  full: radius.full,
  lg: radius.lg,
  md: radius.md,
  sm: radius.sm
} as const

export type SkeletonRoundedType = keyof typeof ROUNDED_BY_VARIANT

export const LOADING_SKELETON_STYLES = createThemedStyles({
  build: (palette) => ({
    root: {
      backgroundColor: palette.glass.fill,
      overflow: 'hidden'
    }
  })
})

export const SKELETON_SHIMMER_STYLES = StyleSheet.create({
  shimmer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  }
})
