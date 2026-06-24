'use client'

import { useTranslations } from 'next-intl'
import type { JSX, ReactNode } from 'react'
import type { VariantProps } from 'tailwind-variants'

import {
  MODAL_BODY,
  MODAL_CLOSE_BTN,
  MODAL_TITLE,
  modalPanelVariants,
  modalScrimVariants
} from '@/components/ui/Modal/Modal.styles'
import { useModalDismiss } from '@/components/ui/Modal/useModalDismiss.hook'

export interface IModalProps extends VariantProps<
  typeof modalPanelVariants
> {
  children: ReactNode
  isOpen: boolean
  onClose: () => void
  title?: string
}

export const Modal = ({
  children,
  isOpen,
  onClose,
  size,
  title
}: IModalProps): JSX.Element | null => {
  const t = useTranslations('components.modal')

  useModalDismiss({ isOpen, onClose })

  if (!isOpen) {
    return null
  }

  return (
    <div
      aria-modal="true"
      className={modalScrimVariants()}
      onClick={onClose}
      role="dialog"
    >
      <div
        className={modalPanelVariants({ size })}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label={t('close')}
          className={MODAL_CLOSE_BTN}
          onClick={onClose}
          type="button"
        >
          <svg
            aria-hidden="true"
            fill="none"
            height={16}
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            viewBox="0 0 24 24"
            width={16}
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {title !== undefined && <h2 className={MODAL_TITLE}>{title}</h2>}

        <div className={MODAL_BODY}>{children}</div>
      </div>
    </div>
  )
}
