/**
 * Shared Tailwind class-string constants.
 * Import these instead of repeating inline className strings.
 * Organized by concern — mirrors the design token categories.
 *
 * Convention: all keys are SCREAMING_SNAKE_CASE so they visually stand out
 * from JSX attribute names in components.
 */

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export const LAYOUT = {
  SCREEN: 'min-h-screen bg-bg-base relative',
  CONTENT_AREA: 'relative z-10',
  SCREEN_PADDING: 'px-4',
  MAX_WIDTH: 'max-w-md mx-auto',
  SECTION_GAP: 'space-y-4',
} as const;

// ---------------------------------------------------------------------------
// Glass
// ---------------------------------------------------------------------------

export const GLASS = {
  CARD: 'glass-card rounded-xl',
  CARD_LG: 'glass-card rounded-[26px]',
  CARD_PADDING: 'p-5',
  DIVIDER: 'border-t border-white/[0.06]',
} as const;

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

export const TEXT = {
  AMOUNT_HERO: 'font-display text-amount-hero font-extrabold text-text-primary tabular-nums',
  AMOUNT: 'font-display text-amount font-bold text-text-primary tabular-nums',
  HEADING: 'font-display text-heading font-bold text-text-primary',
  TITLE: 'font-display text-title font-semibold text-text-primary',
  BODY: 'font-body text-body text-text-primary',
  LABEL: 'font-body text-label font-medium text-text-secondary',
  CAPTION: 'font-body text-caption text-text-tertiary',
  ACCENT: 'text-accent',
  SUCCESS: 'text-success',
  WARNING: 'text-warning',
  DANGER: 'text-danger',
} as const;

// ---------------------------------------------------------------------------
// Aurora & backgrounds
// ---------------------------------------------------------------------------

export const BG = {
  AURORA: 'aurora',
  BASE: 'bg-bg-base',
  RAISED: 'bg-bg-raised',
  ACCENT_TINT: 'bg-accent-tint',
  SUCCESS_TINT: 'bg-success-tint',
} as const;

// ---------------------------------------------------------------------------
// Interactive states
// ---------------------------------------------------------------------------

export const INTERACTION = {
  PRESS: 'active:scale-[0.97] transition-transform duration-[120ms] ease-out',
  DISABLED: 'opacity-40 pointer-events-none',
  FOCUS_RING: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
} as const;
