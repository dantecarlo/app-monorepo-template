import type { ReactNode } from 'react'
import type { VariantProps } from 'tailwind-variants'

import { modalPanelVariants } from '@/components/ui/Modal/Modal.styles'

export interface IModalProps extends VariantProps<
  typeof modalPanelVariants
> {
  children?: ReactNode
  isOpen: boolean
  onClose: () => void
  title?: string
}

export interface IUseModalDismissParams {
  isOpen: boolean
  onClose: () => void
}
