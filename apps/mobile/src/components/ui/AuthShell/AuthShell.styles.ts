import { colors, fontFamily, fontSize, radius, spacing } from '@app/tokens'
import { StyleSheet } from 'react-native'

import { AUTH_SHELL_LOGO_SIZE } from '@/components/ui/AuthShell/AuthShell.constant'

export const AUTH_SHELL_STYLES = StyleSheet.create({
  brandLabel: {
    color: colors.text.primary,
    fontFamily: fontFamily.display,
    fontSize: fontSize.display.size,
    fontWeight: '700',
    lineHeight: fontSize.display.lineHeight,
    marginTop: spacing.md,
    textAlign: 'center'
  },
  form: {
    alignSelf: 'stretch'
  },
  header: {
    alignItems: 'center'
  },
  logo: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: AUTH_SHELL_LOGO_SIZE,
    justifyContent: 'center',
    width: AUTH_SHELL_LOGO_SIZE
  },
  root: {
    alignItems: 'center',
    flex: 1,
    gap: spacing['3xl'],
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing['3xl']
  },
  subtitle: {
    color: colors.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.body.size,
    lineHeight: fontSize.body.lineHeight,
    marginTop: spacing.xs,
    textAlign: 'center'
  },
  title: {
    color: colors.text.primary,
    fontFamily: fontFamily.display,
    fontSize: fontSize.heading.size,
    fontWeight: '600',
    lineHeight: fontSize.heading.lineHeight,
    marginTop: spacing.xl,
    textAlign: 'center'
  }
})
