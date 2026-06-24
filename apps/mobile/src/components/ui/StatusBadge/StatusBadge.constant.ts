import { colors } from '@app/tokens'

export const STATUS_BADGE_DOT_SIZE = 6
export const STATUS_BADGE_H_PADDING = 10
export const STATUS_BADGE_V_PADDING = 4

export type StatusBadgeToneType =
  | 'danger'
  | 'neutral'
  | 'success'
  | 'warning'

export const STATUS_BADGE_TONE_COLORS: Record<
  StatusBadgeToneType,
  { bg: string; dot: string; text: string }
> = {
  danger: {
    bg: colors.dangerTint,
    dot: colors.danger,
    text: colors.danger
  },
  neutral: {
    bg: colors.neutralTint,
    dot: colors.text.secondary,
    text: colors.text.secondary
  },
  success: {
    bg: colors.successTint,
    dot: colors.success,
    text: colors.success
  },
  warning: {
    bg: colors.warningTint,
    dot: colors.warning,
    text: colors.warning
  }
}
