import { colors, radius } from '@app/tokens'

export const AVATAR_VARIANT_COLORS = {
  accent: {
    backgroundColor: colors.accentTint,
    textColor: colors.accent
  },
  glass: {
    backgroundColor: colors.glass.fill,
    textColor: colors.text.secondary
  },
  neutral: {
    backgroundColor: colors.neutralTint,
    textColor: colors.text.secondary
  }
} as const

export type AvatarVariantType = keyof typeof AVATAR_VARIANT_COLORS

export const AVATAR_BORDER_RADIUS: Record<28 | 36 | 44, number> = {
  28: radius.full,
  36: radius.full,
  44: radius.full
}
