import { colors, fontFamily, fontSize, radius, spacing } from '@app/tokens'
import { StyleSheet } from 'react-native'

export const ERROR_STATE_ICON_CONTAINER_SIZE = 64

export const ERROR_STATE_STYLES = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing['2xl']
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: colors.dangerTint,
    borderRadius: radius.full,
    height: ERROR_STATE_ICON_CONTAINER_SIZE,
    justifyContent: 'center',
    width: ERROR_STATE_ICON_CONTAINER_SIZE
  },
  iconGlyph: {
    color: colors.danger,
    fontFamily: fontFamily.body,
    fontSize: fontSize.heading.size,
    lineHeight: fontSize.heading.lineHeight
  },
  message: {
    color: colors.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.body.size,
    lineHeight: fontSize.body.lineHeight,
    textAlign: 'center'
  },
  retryButton: {
    backgroundColor: colors.glass.fill,
    borderColor: colors.glass.stroke,
    borderRadius: radius.full,
    borderWidth: 1,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  retryLabel: {
    color: colors.text.primary,
    fontFamily: fontFamily.display,
    fontSize: fontSize.button.size,
    lineHeight: fontSize.button.lineHeight
  },
  title: {
    color: colors.text.primary,
    fontFamily: fontFamily.display,
    fontSize: fontSize.heading.size,
    lineHeight: fontSize.heading.lineHeight,
    textAlign: 'center'
  }
})
