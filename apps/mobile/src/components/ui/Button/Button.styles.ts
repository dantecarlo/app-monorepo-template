export const BUTTON_BASE_CLASS =
  'flex-row items-center justify-center gap-2 rounded-full font-bold active:opacity-70'

export const BUTTON_SIZE_CLASS: Record<string, string> = {
  lg: 'h-14 px-8',
  md: 'h-12 px-6',
  sm: 'h-9 px-4'
}

export const BUTTON_VARIANT_CLASS: Record<string, string> = {
  ghost: 'bg-transparent',
  primary: 'bg-accent shadow-accent-glow',
  secondary: 'bg-glass-fill border border-glass-stroke'
}

export const BUTTON_TEXT_BASE_CLASS = 'font-display font-bold'
export const BUTTON_TEXT_SIZE_CLASS: Record<string, string> = {
  lg: 'text-heading',
  md: 'text-button',
  sm: 'text-label'
}
export const BUTTON_TEXT_VARIANT_CLASS: Record<string, string> = {
  ghost: 'text-accent',
  primary: 'text-accent-ink',
  secondary: 'text-text-primary'
}

export const BUTTON_FULL_WIDTH_CLASS = 'w-full'
