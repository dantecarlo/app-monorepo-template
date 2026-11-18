// The option names of each variant of the block's tv config, and the union
// its props take; the block's constant test holds them to the config.
export const CONFIRM_DIALOG_TONE_VARIANTS = [
  'accent',
  'destructive'
] as const
export type ConfirmDialogToneType =
  (typeof CONFIRM_DIALOG_TONE_VARIANTS)[number]
