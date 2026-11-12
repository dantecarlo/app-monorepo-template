'use client'

import { useEffect } from 'react'

import { ESCAPE_KEY } from '@/components/ui/Modal/Modal.constant'
import type { IUseModalDismissParams } from '@/components/ui/Modal/Modal.type'

export const useModalDismiss = ({
  isOpen,
  onClose
}: IUseModalDismissParams): void => {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === ESCAPE_KEY) {
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])
}
