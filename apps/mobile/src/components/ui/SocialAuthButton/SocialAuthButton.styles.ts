import { colors, fontFamily, fontSize, radius, spacing } from '@app/tokens'
import { StyleSheet } from 'react-native'

export const SOCIAL_AUTH_GLYPH_SIZE = 18

export const SOCIAL_AUTH_STYLES = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.glass.fill,
    borderColor: colors.glass.stroke,
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md
  },
  label: {
    color: colors.text.primary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.button.size,
    fontWeight: '500',
    lineHeight: fontSize.button.lineHeight
  }
})
