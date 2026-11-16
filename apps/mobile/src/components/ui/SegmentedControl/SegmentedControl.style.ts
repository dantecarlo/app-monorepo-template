import { fontSize, radius, spacing } from '@app/tokens'

import {
  createThemedStyles,
  createThemedValues
} from '@/lib/theme/createThemedStyles.helper'

export const SEGMENT_COLORS = createThemedValues({
  build: (palette) =>
    ({
      active: {
        backgroundColor: palette.accentTint,
        textColor: palette.accent
      },
      inactive: {
        backgroundColor: 'transparent',
        textColor: palette.text.secondary
      }
    }) as const
})

export const SEGMENTED_CONTROL_STYLES = createThemedStyles({
  build: (palette) => ({
    segment: {
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs
    },
    segmentLabel: {
      fontSize: fontSize.label.size,
      lineHeight: fontSize.label.lineHeight
    },
    track: {
      backgroundColor: palette.glass.fill,
      borderColor: palette.glass.stroke,
      borderRadius: radius.full,
      borderWidth: 1,
      flexDirection: 'row',
      gap: spacing.xs,
      padding: spacing.xs
    }
  })
})
