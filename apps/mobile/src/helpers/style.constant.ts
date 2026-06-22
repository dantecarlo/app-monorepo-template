// RN-safe style constants — mirrors apps/web/src/helpers/style.constant.ts.
// Instead of Tailwind class strings, these are plain objects used with StyleSheet.create()
// or spread directly into style props.
// Token values imported from @app/ui/src/tokens.ts.

import { StyleSheet } from 'react-native';
import { colors, spacing, radius, fontSize, fontFamily, rnShadows } from '@app/ui';

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export const LAYOUT = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  contentArea: {
    flex: 1,
  },
  screenPadding: {
    paddingHorizontal: spacing.lg,
  },
  maxWidth: {
    maxWidth: 428,
    alignSelf: 'center' as const,
    width: '100%',
  },
  sectionGap: {
    gap: spacing.lg,
  },
});

// ---------------------------------------------------------------------------
// Glass
// ---------------------------------------------------------------------------

export const GLASS = StyleSheet.create({
  card: {
    backgroundColor: colors.glass.fill,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glass.stroke,
    ...rnShadows.card,
  },
  cardLg: {
    backgroundColor: colors.glass.fill,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glass.stroke,
    ...rnShadows.card,
  },
  cardPadding: {
    padding: spacing.xl,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const TEXT = StyleSheet.create({
  amountHero: {
    fontFamily: `${fontFamily.display}_800ExtraBold`,
    fontSize: fontSize.amountHero.size,
    lineHeight: fontSize.amountHero.lineHeight,
    color: colors.text.primary,
  },
  amount: {
    fontFamily: `${fontFamily.display}_700Bold`,
    fontSize: fontSize.amount.size,
    lineHeight: fontSize.amount.lineHeight,
    color: colors.text.primary,
  },
  heading: {
    fontFamily: `${fontFamily.display}_700Bold`,
    fontSize: fontSize.heading.size,
    lineHeight: fontSize.heading.lineHeight,
    color: colors.text.primary,
  },
  title: {
    fontFamily: `${fontFamily.display}_600SemiBold`,
    fontSize: fontSize.title.size,
    lineHeight: fontSize.title.lineHeight,
    color: colors.text.primary,
  },
  body: {
    fontFamily: `${fontFamily.body}_400Regular`,
    fontSize: fontSize.body.size,
    lineHeight: fontSize.body.lineHeight,
    color: colors.text.primary,
  },
  label: {
    fontFamily: `${fontFamily.body}_500Medium`,
    fontSize: fontSize.label.size,
    lineHeight: fontSize.label.lineHeight,
    color: colors.text.secondary,
  },
  caption: {
    fontFamily: `${fontFamily.body}_400Regular`,
    fontSize: fontSize.caption.size,
    lineHeight: fontSize.caption.lineHeight,
    color: colors.text.tertiary,
  },
  accent: {
    color: colors.accent,
  },
  success: {
    color: colors.success,
  },
  warning: {
    color: colors.warning,
  },
  danger: {
    color: colors.danger,
  },
});

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------

export const INTERACTION = {
  // Used with Animated/Reanimated — not StyleSheet
  pressScale: 0.97,
  pressDuration: 120,
  disabledOpacity: 0.4,
} as const;
