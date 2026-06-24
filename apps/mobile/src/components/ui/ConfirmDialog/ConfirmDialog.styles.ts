import { colors, fontFamily, fontSize, radius, spacing } from '@app/tokens'
import { StyleSheet } from 'react-native'

export const CONFIRM_PRESSED_OPACITY = 0.85

export const CONFIRM_DIALOG_STYLES = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'flex-end',
    marginTop: spacing.lg
  },
  cancelButton: {
    backgroundColor: colors.glass.fill,
    borderColor: colors.glass.stroke,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  cancelLabel: {
    color: colors.text.secondary,
    fontFamily: fontFamily.display,
    fontSize: fontSize.button.size,
    lineHeight: fontSize.button.lineHeight
  },
  confirmButton: {
    backgroundColor: colors.danger,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  confirmLabel: {
    color: colors.text.primary,
    fontFamily: fontFamily.display,
    fontSize: fontSize.button.size,
    lineHeight: fontSize.button.lineHeight
  },
  message: {
    color: colors.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.body.size,
    lineHeight: fontSize.body.lineHeight,
    marginBottom: spacing.md
  }
})
