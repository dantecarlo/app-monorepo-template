export const TOGGLE = {
  KNOB_BASE:
    'pointer-events-none absolute top-[2.5px] inline-block h-[18px] w-[18px] rounded-full shadow-card transition-transform',
  KNOB_OFF: 'translate-x-[2.5px] bg-knob-off',
  KNOB_ON: 'translate-x-[17px] bg-knob-on',
  TRACK_BASE:
    'relative inline-flex h-[23px] w-10 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50',
  TRACK_OFF: 'bg-neutral-tint',
  TRACK_ON: 'bg-accent shadow-accent-glow'
} as const
