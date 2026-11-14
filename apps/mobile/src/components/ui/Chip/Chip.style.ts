export const CHIP_BASE_CLASS =
  'flex-row items-center gap-1.5 rounded-full px-[11px] py-[5px]'

export const CHIP_VARIANT_CLASS: Record<string, string> = {
  accent: 'bg-accent-tint',
  glass: 'bg-glass-fill border border-glass-stroke',
  neutral: 'bg-white/[0.08]',
  success: 'bg-success-tint'
}

export const CHIP_TEXT_BASE_CLASS = 'font-body text-caption font-medium'

export const CHIP_TEXT_VARIANT_CLASS: Record<string, string> = {
  accent: 'text-accent',
  glass: 'text-text-secondary',
  neutral: 'text-text-secondary',
  success: 'text-success'
}
