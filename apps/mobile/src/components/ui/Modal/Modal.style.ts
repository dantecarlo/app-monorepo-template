import {
  fontFamily,
  fontSize,
  radius,
  rnShadows,
  spacing
} from '@app/tokens'

import {
  MODAL_CLOSE_ICON_SIZE,
  MODAL_GRABBER_HEIGHT,
  MODAL_GRABBER_WIDTH
} from '@/components/ui/Modal/Modal.constant'
import { createThemedStyles } from '@/lib/theme/createThemedStyles.helper'

export const MODAL_STYLES = createThemedStyles({
  build: (palette) => ({
    closeGlyph: {
      color: palette.text.secondary,
      fontFamily: fontFamily.body,
      fontSize: MODAL_CLOSE_ICON_SIZE,
      lineHeight: MODAL_CLOSE_ICON_SIZE
    },
    closePressable: {
      padding: spacing.xs
    },
    grabber: {
      alignSelf: 'center',
      backgroundColor: palette.glass.stroke,
      borderRadius: radius.full,
      height: MODAL_GRABBER_HEIGHT,
      marginBottom: spacing.sm,
      width: MODAL_GRABBER_WIDTH
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.md
    },
    panel: {
      ...rnShadows.card,
      backgroundColor: palette.glass.fill,
      borderColor: palette.glass.stroke,
      borderRadius: radius.xl,
      borderWidth: 1,
      paddingBottom: spacing['2xl'],
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      width: '100%'
    },
    scrim: {
      backgroundColor: palette.scrim,
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0
    },
    title: {
      color: palette.text.primary,
      flex: 1,
      fontFamily: fontFamily.display,
      fontSize: fontSize.heading.size,
      lineHeight: fontSize.heading.lineHeight
    },
    viewport: {
      flex: 1,
      justifyContent: 'flex-end'
    }
  })
})
