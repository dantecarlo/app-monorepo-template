import { createThemedValues } from '@/lib/theme/createThemedStyles.helper'
import type { ToastVariantType } from '@/stores/toast.store'

export const TOAST_BOTTOM_OFFSET = 32
export const TOAST_DOT_SIZE = 8

export const TOAST_DOT_COLOR = createThemedValues({
  build: (palette): Record<ToastVariantType, string> => ({
    error: palette.danger,
    info: palette.text.secondary,
    success: palette.success,
    warning: palette.warning
  })
})
