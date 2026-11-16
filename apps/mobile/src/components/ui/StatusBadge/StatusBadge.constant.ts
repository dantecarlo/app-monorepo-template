import { createThemedValues } from '@/lib/theme/createThemedStyles.helper'

export const STATUS_BADGE_DOT_SIZE = 6
export const STATUS_BADGE_H_PADDING = 10
export const STATUS_BADGE_V_PADDING = 4

export type StatusBadgeToneType =
  | 'danger'
  | 'neutral'
  | 'success'
  | 'warning'

export const STATUS_BADGE_TONE_COLORS = createThemedValues({
  build: (
    palette
  ): Record<
    StatusBadgeToneType,
    { bg: string; dot: string; text: string }
  > => ({
    danger: {
      bg: palette.dangerTint,
      dot: palette.danger,
      text: palette.danger
    },
    neutral: {
      bg: palette.neutralTint,
      dot: palette.text.secondary,
      text: palette.text.secondary
    },
    success: {
      bg: palette.successTint,
      dot: palette.success,
      text: palette.success
    },
    warning: {
      bg: palette.warningTint,
      dot: palette.warning,
      text: palette.warning
    }
  })
})
