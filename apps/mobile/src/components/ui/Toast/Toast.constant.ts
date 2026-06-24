import { colors } from '@app/tokens'

import type { ToastVariantType } from '@/stores/toast.store'

export const TOAST_BOTTOM_OFFSET = 32
export const TOAST_DOT_SIZE = 8
export const TOAST_DISMISS_LABEL = 'Dismiss'

export const TOAST_DOT_COLOR: Record<ToastVariantType, string> = {
  error: colors.danger,
  info: colors.text.secondary,
  success: colors.success,
  warning: colors.warning
}
