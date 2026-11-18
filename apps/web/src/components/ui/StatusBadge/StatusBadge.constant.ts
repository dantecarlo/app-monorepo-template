// The option names of the tone of the badge and of its dot, and the union its
// props take; the block's constant test holds them to both tv configs.
export const STATUS_BADGE_TONE_VARIANTS = [
  'danger',
  'neutral',
  'success',
  'warning'
] as const
export type StatusBadgeToneType =
  (typeof STATUS_BADGE_TONE_VARIANTS)[number]
