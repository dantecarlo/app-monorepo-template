// RN-safe style constants — mirrors apps/web/src/helpers/style.constant.ts.
// Instead of Tailwind class strings, these are plain objects used with StyleSheet.create()
// or spread directly into style props.
// Token values imported from @app/tokens/src/tokens.ts.

import {
  colors,
  fontFamily,
  fontSize,
  radius,
  rnShadows,
  spacing
} from '@app/tokens'
import { StyleSheet } from 'react-native'

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export const LAYOUT = StyleSheet.create({
  contentArea: {
    flex: 1
  },
  maxWidth: {
    alignSelf: 'center' as const,
    maxWidth: 428,
    width: '100%'
  },
  screen: {
    backgroundColor: colors.bg.base,
    flex: 1
  },
  screenPadding: {
    paddingHorizontal: spacing.lg
  },
  sectionGap: {
    gap: spacing.lg
  }
})

// ---------------------------------------------------------------------------
// Glass
// ---------------------------------------------------------------------------

export const GLASS = StyleSheet.create({
  card: {
    backgroundColor: colors.glass.fill,
    borderColor: colors.glass.stroke,
    borderRadius: radius.xl,
    borderWidth: 1,
    ...rnShadows.card
  },
  cardLg: {
    backgroundColor: colors.glass.fill,
    borderColor: colors.glass.stroke,
    borderRadius: radius.xl,
    borderWidth: 1,
    ...rnShadows.card
  },
  cardPadding: {
    padding: spacing.xl
  },
  divider: {
    borderTopColor: colors.divider,
    borderTopWidth: 1
  }
})

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const TEXT = StyleSheet.create({
  accent: {
    color: colors.accent
  },
  amount: {
    color: colors.text.primary,
    fontFamily: `${fontFamily.display}_700Bold`,
    fontSize: fontSize.amount.size,
    lineHeight: fontSize.amount.lineHeight
  },
  amountHero: {
    color: colors.text.primary,
    fontFamily: `${fontFamily.display}_800ExtraBold`,
    fontSize: fontSize.amountHero.size,
    lineHeight: fontSize.amountHero.lineHeight
  },
  body: {
    color: colors.text.primary,
    fontFamily: `${fontFamily.body}_400Regular`,
    fontSize: fontSize.body.size,
    lineHeight: fontSize.body.lineHeight
  },
  caption: {
    color: colors.text.tertiary,
    fontFamily: `${fontFamily.body}_400Regular`,
    fontSize: fontSize.caption.size,
    lineHeight: fontSize.caption.lineHeight
  },
  danger: {
    color: colors.danger
  },
  heading: {
    color: colors.text.primary,
    fontFamily: `${fontFamily.display}_700Bold`,
    fontSize: fontSize.heading.size,
    lineHeight: fontSize.heading.lineHeight
  },
  label: {
    color: colors.text.secondary,
    fontFamily: `${fontFamily.body}_500Medium`,
    fontSize: fontSize.label.size,
    lineHeight: fontSize.label.lineHeight
  },
  success: {
    color: colors.success
  },
  title: {
    color: colors.text.primary,
    fontFamily: `${fontFamily.display}_600SemiBold`,
    fontSize: fontSize.title.size,
    lineHeight: fontSize.title.lineHeight
  },
  warning: {
    color: colors.warning
  }
})

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------

export const INTERACTION = {
  disabledOpacity: 0.4,

  pressDuration: 120,
  // Used with Animated/Reanimated — not StyleSheet
  pressScale: 0.97
} as const
