// Source of truth for the dark-glass design system.
// These are stack-agnostic plain TS objects — no framework imports.
// Consumed by Tailwind (web) via tailwind-preset.cjs and by NativeWind (mobile) directly.

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export const colors = {
  accent: '#FF6A1A',
  accentInk: '#2A1402',
  accentLight: '#FF8A3D',
  accentTint: 'rgba(255,106,26,0.16)',
  bg: {
    base: '#0A0B0D',
    raised: '#101216'
  },
  coolGlow: '#5B6CFF',
  danger: '#EF4444',
  dangerTint: 'rgba(239,68,68,0.16)',
  divider: 'rgba(255,255,255,0.06)',
  glass: {
    fill: 'rgba(24,27,34,0.42)',
    stroke: 'rgba(255,255,255,0.10)'
  },
  knob: {
    off: '#80828B',
    on: '#FFFFFF'
  },
  neutralTint: 'rgba(255,255,255,0.08)',
  scrim: 'rgba(0,0,0,0.60)',
  success: '#34C759',
  successTint: 'rgba(52,199,89,0.16)',
  text: {
    disabled: 'rgba(255,255,255,0.25)',
    primary: '#F7F8FA',
    secondary: 'rgba(255,255,255,0.55)',
    tertiary: '#7E808A'
  },
  warning: '#E0A011',
  warningTint: 'rgba(224,160,17,0.16)'
} as const

// ---------------------------------------------------------------------------
// Spacing — 8pt scale
// ---------------------------------------------------------------------------

export const spacing = {
  '2xl': 24,
  '3xl': 32,
  lg: 16,
  md: 12,
  sm: 8,
  xl: 20,
  xs: 4
} as const

// ---------------------------------------------------------------------------
// Border radius
// ---------------------------------------------------------------------------

export const radius = {
  full: 9999,
  lg: 20,
  md: 14,
  sm: 8,
  xl: 26
} as const

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const fontFamily = {
  body: 'Inter',
  display: 'Montserrat'
} as const

/** Each entry: { size: number (px), lineHeight: number (px) } */
export const fontSize = {
  amount: { lineHeight: 24, size: 20 },
  amountHero: { lineHeight: 44, size: 40 },
  body: { lineHeight: 20, size: 14 },
  button: { lineHeight: 20, size: 15 },
  caption: { lineHeight: 15, size: 12 },
  display: { lineHeight: 34, size: 28 },
  heading: { lineHeight: 22, size: 18 },
  label: { lineHeight: 18, size: 13 },
  title: { lineHeight: 20, size: 15 }
} as const

// ---------------------------------------------------------------------------
// Shadows
// ---------------------------------------------------------------------------

/**
 * CSS box-shadow strings — for web (Next.js / Tailwind).
 * Note: `rimLight` is an inset shadow (glass top edge).
 */
export const shadows = {
  accentGlow: '0 12px 30px 0 rgba(255,106,26,0.50)',
  card: '0 18px 44px -6px rgba(0,0,0,0.50), 0 2px 8px 0 rgba(0,0,0,0.28)',
  markerGlow: '0 0 8px 0 rgba(255,255,255,0.60)',
  rimLight: 'inset 0 1px 0 0 rgba(255,255,255,0.18)'
} as const

/**
 * React Native shadow props — parallel to `shadows` above.
 * RN does not support box-shadow; each entry is a style object spread.
 */
export const rnShadows = {
  accentGlow: {
    elevation: 8,
    shadowColor: '#FF6A1A',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15
  },
  card: {
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { height: 9, width: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 22
  },
  markerGlow: {
    elevation: 4,
    shadowColor: '#FFFFFF',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4
  }
} as const

// ---------------------------------------------------------------------------
// Gradients
// ---------------------------------------------------------------------------

export const gradients = {
  /** Vertical accent gradient — buttons, toggles-on, logo */
  accent: 'linear-gradient(180deg,#FF8A3D,#FF6A1A)'
} as const

// ---------------------------------------------------------------------------
// Aggregate export
// ---------------------------------------------------------------------------

export const tokens = {
  colors,
  fontFamily,
  fontSize,
  gradients,
  radius,
  rnShadows,
  shadows,
  spacing
} as const

export default tokens
