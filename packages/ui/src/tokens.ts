// Source of truth for the dark-glass design system.
// These are stack-agnostic plain TS objects — no framework imports.
// Consumed by Tailwind (web) via tailwind-preset.cjs and by NativeWind (mobile) directly.

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export const colors = {
  bg: {
    base: '#0A0B0D',
    raised: '#101216',
  },
  glass: {
    fill: 'rgba(24,27,34,0.42)',
    stroke: 'rgba(255,255,255,0.10)',
  },
  divider: 'rgba(255,255,255,0.06)',
  text: {
    primary: '#F7F8FA',
    secondary: 'rgba(255,255,255,0.55)',
    tertiary: '#7E808A',
    disabled: 'rgba(255,255,255,0.25)',
  },
  accent: '#FF6A1A',
  accentLight: '#FF8A3D',
  accentInk: '#2A1402',
  accentTint: 'rgba(255,106,26,0.16)',
  success: '#34C759',
  successTint: 'rgba(52,199,89,0.16)',
  warning: '#E0A011',
  danger: '#EF4444',
  coolGlow: '#5B6CFF',
} as const;

// ---------------------------------------------------------------------------
// Spacing — 8pt scale
// ---------------------------------------------------------------------------

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

// ---------------------------------------------------------------------------
// Border radius
// ---------------------------------------------------------------------------

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 26,
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const fontFamily = {
  display: 'Montserrat',
  body: 'Inter',
} as const;

/** Each entry: { size: number (px), lineHeight: number (px) } */
export const fontSize = {
  amountHero: { size: 40, lineHeight: 44 },
  amount:     { size: 20, lineHeight: 24 },
  display:    { size: 28, lineHeight: 34 },
  heading:    { size: 18, lineHeight: 22 },
  title:      { size: 15, lineHeight: 20 },
  button:     { size: 15, lineHeight: 20 },
  label:      { size: 13, lineHeight: 18 },
  body:       { size: 14, lineHeight: 20 },
  caption:    { size: 12, lineHeight: 15 },
} as const;

// ---------------------------------------------------------------------------
// Shadows
// ---------------------------------------------------------------------------

/**
 * CSS box-shadow strings — for web (Next.js / Tailwind).
 * Note: `rimLight` is an inset shadow (glass top edge).
 */
export const shadows = {
  card: '0 18px 44px -6px rgba(0,0,0,0.50), 0 2px 8px 0 rgba(0,0,0,0.28)',
  accentGlow: '0 12px 30px 0 rgba(255,106,26,0.50)',
  markerGlow: '0 0 8px 0 rgba(255,255,255,0.60)',
  rimLight: 'inset 0 1px 0 0 rgba(255,255,255,0.18)',
} as const;

/**
 * React Native shadow props — parallel to `shadows` above.
 * RN does not support box-shadow; each entry is a style object spread.
 */
export const rnShadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.50,
    shadowRadius: 22,
    elevation: 12,
  },
  accentGlow: {
    shadowColor: '#FF6A1A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.50,
    shadowRadius: 15,
    elevation: 8,
  },
  markerGlow: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.60,
    shadowRadius: 4,
    elevation: 4,
  },
} as const;

// ---------------------------------------------------------------------------
// Gradients
// ---------------------------------------------------------------------------

export const gradients = {
  /** Vertical accent gradient — buttons, toggles-on, logo */
  accent: 'linear-gradient(180deg,#FF8A3D,#FF6A1A)',
} as const;

// ---------------------------------------------------------------------------
// Aggregate export
// ---------------------------------------------------------------------------

export const tokens = {
  colors,
  spacing,
  radius,
  fontFamily,
  fontSize,
  shadows,
  rnShadows,
  gradients,
} as const;

export default tokens;
