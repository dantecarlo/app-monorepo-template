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
  CONTENT_AREA: 'relative z-10',
  MAX_WIDTH: 'max-w-[28rem] mx-auto',
  SCREEN: 'min-h-screen bg-bg-base relative',
  SCREEN_PADDING: 'px-4',
  SECTION_GAP: 'space-y-4'
} as const

// ---------------------------------------------------------------------------
// Glass
// ---------------------------------------------------------------------------

export const GLASS = {
  CARD: 'glass-card rounded-xl',
  CARD_LG: 'glass-card rounded-[26px]',
  CARD_PADDING: 'p-5',
  DIVIDER: 'border-t border-white/[0.06]'
} as const

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

export const TEXT = {
  ACCENT: 'text-accent-text',
  AMOUNT:
    'font-display text-amount font-bold text-text-primary tabular-nums',
  AMOUNT_HERO:
    'font-display text-amount-hero font-extrabold text-text-primary tabular-nums',
  BODY: 'font-body text-body text-text-primary',
  CAPTION: 'font-body text-caption text-text-tertiary',
  DANGER: 'text-danger-text',
  HEADING: 'font-display text-heading font-bold text-text-primary',
  LABEL: 'font-body text-label font-medium text-text-secondary',
  SUCCESS: 'text-success-text',
  TITLE: 'font-display text-title font-semibold text-text-primary',
  WARNING: 'text-warning-text'
} as const

// ---------------------------------------------------------------------------
// Aurora & backgrounds
// ---------------------------------------------------------------------------

export const BG = {
  ACCENT_TINT: 'bg-accent-tint',
  AURORA: 'aurora',
  BASE: 'bg-bg-base',
  RAISED: 'bg-bg-raised',
  SUCCESS_TINT: 'bg-success-tint'
} as const

// ---------------------------------------------------------------------------
// Interactive states
// ---------------------------------------------------------------------------

export const INTERACTION = {
  DISABLED: 'opacity-40 pointer-events-none',
  FOCUS_RING:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
  PRESS:
    'active:scale-[0.97] transition-transform duration-[120ms] ease-out'
} as const
