import { fontSize, radius, spacing } from '@app/tokens'

import { HEIGHT } from '@/components/ui/SearchBar/SearchBar.constant'
import { createThemedStyles } from '@/lib/theme/createThemedStyles.helper'

export const SEARCH_BAR_STYLES = createThemedStyles({
  build: (palette) => ({
    container: {
      alignItems: 'center',
      backgroundColor: palette.glass.fill,
      borderColor: palette.glass.stroke,
      borderRadius: radius.md,
      borderWidth: 1,
      flexDirection: 'row',
      gap: spacing.sm,
      height: HEIGHT,
      paddingHorizontal: spacing.md
    },
    input: {
      color: palette.text.primary,
      flex: 1,
      fontSize: fontSize.body.size,
      lineHeight: fontSize.body.lineHeight
    }
  })
})
