import { colors, fontFamily, fontSize, radius, spacing } from '@app/tokens'
import { StyleSheet } from 'react-native'

import { NAV_BAR_BOTTOM_OFFSET } from '@/components/ui/NavBar/NavBar.constant'

export const NAV_BAR_STYLES = StyleSheet.create({
  blur: {
    borderRadius: radius.full,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  item: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  label: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption.size,
    lineHeight: fontSize.caption.lineHeight
  },
  overlay: {
    backgroundColor: colors.glass.fill,
    borderRadius: radius.full,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  pill: {
    alignItems: 'center',
    borderColor: colors.glass.stroke,
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  root: {
    alignSelf: 'center',
    bottom: NAV_BAR_BOTTOM_OFFSET,
    position: 'absolute'
  }
})
