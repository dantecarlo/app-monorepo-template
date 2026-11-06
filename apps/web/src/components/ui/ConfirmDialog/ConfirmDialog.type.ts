import type { VariantProps } from 'tailwind-variants'

import { confirmButtonVariants } from '@/components/ui/ConfirmDialog/ConfirmDialog.styles'

export interface IConfirmDialogProps extends VariantProps<
  typeof confirmButtonVariants
> {
  cancelLabel?: string
  confirmLabel?: string
  isOpen: boolean
  message: string
  onCancel: () => void
  onConfirm: () => void
  title?: string
}
