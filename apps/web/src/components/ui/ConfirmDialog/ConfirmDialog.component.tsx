'use client'

import { useTranslations } from 'next-intl'
import type { JSX } from 'react'

import {
  CANCEL_BUTTON,
  CONFIRM_DIALOG_ACTIONS,
  confirmButtonVariants
} from '@/components/ui/ConfirmDialog/ConfirmDialog.style'
import type { IConfirmDialogProps } from '@/components/ui/ConfirmDialog/ConfirmDialog.type'
import { Modal } from '@/components/ui/Modal/Modal.component'

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
  const t = useTranslations('common')

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <p>{message}</p>
      <div className={CONFIRM_DIALOG_ACTIONS}>
        <button className={CANCEL_BUTTON} onClick={onCancel} type="button">
          {cancelLabel ?? t('cancel')}
        </button>
        <button
          className={confirmButtonVariants({ tone })}
          onClick={onConfirm}
          type="button"
        >
          {confirmLabel ?? t('confirm')}
        </button>
      </div>
    </Modal>
  )
}
