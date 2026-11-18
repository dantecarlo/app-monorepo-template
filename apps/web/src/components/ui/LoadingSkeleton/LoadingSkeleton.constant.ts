// The option names of each variant of the block's tv config, and the union
// its props take; the block's constant test holds them to the config.
export const LOADING_SKELETON_ROUNDED_VARIANTS = [
  'full',
  'lg',
  'md',
  'sm'
] as const
export type LoadingSkeletonRoundedType =
  (typeof LOADING_SKELETON_ROUNDED_VARIANTS)[number]
