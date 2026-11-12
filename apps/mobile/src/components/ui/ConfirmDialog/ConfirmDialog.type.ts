export interface IConfirmDialogProps {
  cancelLabel?: string
  confirmLabel?: string
  isOpen: boolean
  message: string
  onCancel: () => void
  onConfirm: () => void
  title?: string
}
