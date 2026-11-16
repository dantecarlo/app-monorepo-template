import { fontFamily, fontSize, spacing } from '@app/tokens'

import { createThemedStyles } from '@/lib/theme/createThemedStyles.helper'

export const AUTH_SHELL_STYLES = createThemedStyles({
  build: (palette) => ({
    brandLabel: {
      color: palette.text.primary,
      fontFamily: fontFamily.display,
      fontSize: fontSize.display.size,
      fontWeight: '700',
      lineHeight: fontSize.display.lineHeight,
      marginTop: spacing.md,
      textAlign: 'center'
    },
    controls: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
      position: 'absolute',
      right: spacing.lg,
      zIndex: 10
    },
    form: {
      alignSelf: 'stretch'
    },
    header: {
      alignItems: 'center'
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
      color: palette.text.secondary,
      fontFamily: fontFamily.body,
      fontSize: fontSize.body.size,
      lineHeight: fontSize.body.lineHeight,
      marginTop: spacing.xs,
      textAlign: 'center'
    },
    title: {
      color: palette.text.primary,
      fontFamily: fontFamily.display,
      fontSize: fontSize.heading.size,
      fontWeight: '600',
      lineHeight: fontSize.heading.lineHeight,
      marginTop: spacing.xl,
      textAlign: 'center'
    }
  })
})
