import { colors, fontFamily, fontSize, radius, spacing } from '@app/tokens'
import { StyleSheet } from 'react-native'

export const AUTH_FIELD_STYLES = StyleSheet.create({
  errorText: {
    color: colors.danger,
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption.size,
    lineHeight: fontSize.caption.lineHeight
  },
  helperText: {
    color: colors.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption.size,
    lineHeight: fontSize.caption.lineHeight
  },
  input: {
    color: colors.text.primary,
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: fontSize.body.size,
    lineHeight: fontSize.body.lineHeight
  },
  label: {
    color: colors.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.label.size,
    lineHeight: fontSize.label.lineHeight
  },
  revealButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs
  },
  root: {
    gap: spacing.xs
  },
  wrapper: {
    alignItems: 'center',
    backgroundColor: colors.glass.fill,
    borderColor: colors.glass.stroke,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  wrapperError: {
    borderColor: colors.danger
  },
  wrapperFocused: {
    borderColor: colors.accent
  }
})
