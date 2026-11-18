import type { ReactNode } from 'react'

import type { ModalSizeType } from '@/components/ui/Modal/Modal.constant'

export interface IModalProps {
  children?: ReactNode
  isOpen: boolean
  onClose: () => void
  size?: ModalSizeType
  title?: string
}

export interface IUseModalDismissParams {
  isOpen: boolean
  onClose: () => void
}
