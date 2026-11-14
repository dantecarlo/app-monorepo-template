import { colors, fontSize, radius, spacing } from '@app/tokens'
import { StyleSheet } from 'react-native'

import { HEIGHT } from '@/components/ui/SearchBar/SearchBar.constant'

export const SEARCH_BAR_STYLES = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.glass.fill,
    borderColor: colors.glass.stroke,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    height: HEIGHT,
    paddingHorizontal: spacing.md
  },
  input: {
    color: colors.text.primary,
    flex: 1,
    fontSize: fontSize.body.size,
    lineHeight: fontSize.body.lineHeight
  }
})
