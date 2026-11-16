import { radius } from '@app/tokens'

import { createThemedValues } from '@/lib/theme/createThemedStyles.helper'

export const AVATAR_VARIANT_COLORS = createThemedValues({
  build: (palette) =>
    ({
      accent: {
        backgroundColor: palette.accentTint,
        textColor: palette.accent
      },
      glass: {
        backgroundColor: palette.glass.fill,
        textColor: palette.text.secondary
      },
      neutral: {
        backgroundColor: palette.neutralTint,
        textColor: palette.text.secondary
      }
    }) as const
})

export type AvatarVariantType =
  keyof (typeof AVATAR_VARIANT_COLORS)['dark']

export const AVATAR_BORDER_RADIUS: Record<28 | 36 | 44, number> = {
  28: radius.full,
  36: radius.full,
  44: radius.full
}
