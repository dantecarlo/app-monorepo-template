import {
  colors,
  fontFamily,
  fontSize,
  radius,
  rnShadows,
  spacing
} from '@app/tokens'
import { StyleSheet } from 'react-native'

import {
  MODAL_CLOSE_ICON_SIZE,
  MODAL_GRABBER_HEIGHT,
  MODAL_GRABBER_WIDTH
} from '@/components/ui/Modal/Modal.constant'

export const MODAL_STYLES = StyleSheet.create({
  closeGlyph: {
    color: colors.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: MODAL_CLOSE_ICON_SIZE,
    lineHeight: MODAL_CLOSE_ICON_SIZE
  },
  closePressable: {
    padding: spacing.xs
  },
  grabber: {
    alignSelf: 'center',
    backgroundColor: colors.glass.stroke,
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
    backgroundColor: colors.glass.fill,
    borderColor: colors.glass.stroke,
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingBottom: spacing['2xl'],
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    width: '100%'
  },
  scrim: {
    backgroundColor: 'rgba(0,0,0,0.60)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  title: {
    color: colors.text.primary,
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
