'use client'

import type { JSX } from 'react'

import {
  CANCEL_BUTTON,
  CONFIRM_DIALOG_ACTIONS,
  confirmButtonVariants
} from '@/components/ui/ConfirmDialog/ConfirmDialog.style'
import type { IConfirmDialogProps } from '@/components/ui/ConfirmDialog/ConfirmDialog.type'
import { Modal } from '@/components/ui/Modal/Modal.component'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'

export const ConfirmDialog = ({
  cancelLabel,
  confirmLabel,
  isOpen,
  message,
  onCancel,
  onConfirm,
  title,
  tone
}: IConfirmDialogProps): JSX.Element => {
  const { t } = useAppTranslator()

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <p>{message}</p>
      <div className={CONFIRM_DIALOG_ACTIONS}>
        <button className={CANCEL_BUTTON} onClick={onCancel} type="button">
          {cancelLabel ?? t('common.cancel')}
        </button>
        <button
          className={confirmButtonVariants({ tone })}
          onClick={onConfirm}
          type="button"
        >
          {confirmLabel ?? t('common.confirm')}
        </button>
      </div>
    </Modal>
  )
}
