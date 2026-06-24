'use client'

import { useEffect } from 'react'

export interface IUseModalDismissParams {
  isOpen: boolean
  onClose: () => void
}

const ESCAPE_KEY = 'Escape'

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
