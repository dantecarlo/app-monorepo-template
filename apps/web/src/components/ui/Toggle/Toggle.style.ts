export const TOGGLE = {
  KNOB_BASE:
    'pointer-events-none absolute top-knob-inset inline-block size-4.5 rounded-full shadow-card transition-transform',
  KNOB_OFF: 'translate-x-knob-inset bg-knob-off',
  KNOB_ON: 'translate-x-4.25 bg-knob-on',
  TRACK_BASE:
    'relative inline-flex h-5.75 w-10 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50',
  TRACK_OFF: 'bg-neutral-tint',
  TRACK_ON: 'bg-accent shadow-accent-glow'
} as const
