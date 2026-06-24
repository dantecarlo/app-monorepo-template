import { tv } from 'tailwind-variants'

import type { ToastVariantType } from '@/stores/toast.store'

export const TOAST_VIEWPORT =
  'pointer-events-none fixed inset-x-0 bottom-0 z-50 ' +
  'flex flex-col items-center gap-2 p-4'

export const TOAST_MESSAGE = 'flex-1 text-body text-text-primary'

export const TOAST_DOT_CLASS: Record<ToastVariantType, string> = {
  error: 'bg-danger',
  info: 'bg-text-secondary',
  success: 'bg-success',
  warning: 'bg-warning'
}

export const toastPillVariants = tv({
  base: [
    'glass-card pointer-events-auto flex w-full max-w-[24rem] items-center gap-3',
    'rounded-full px-4 py-3',
    'animate-in fade-in slide-in-from-bottom-2 duration-200'
  ]
})

export const TOAST_DOT_BASE = 'h-2 w-2 shrink-0 rounded-full'

export const TOAST_DISMISS_BTN =
  'ml-auto shrink-0 rounded-full p-1 text-text-secondary ' +
  'hover:text-text-primary focus:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-accent'
