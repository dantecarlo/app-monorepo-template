import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { useModalDismiss } from './useModalDismiss.hook'

describe('useModalDismiss', () => {
  let onClose: () => void

  beforeEach(() => {
    onClose = vi.fn()
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  test('does nothing when isOpen is false', () => {
    renderHook(() => useModalDismiss({ isOpen: false, onClose }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(onClose).not.toHaveBeenCalled()
  })

  test('calls onClose when Escape is pressed while open', () => {
    renderHook(() => useModalDismiss({ isOpen: true, onClose }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  test('sets body overflow to hidden while open', () => {
    renderHook(() => useModalDismiss({ isOpen: true, onClose }))
    expect(document.body.style.overflow).toBe('hidden')
  })

  test('restores body overflow on unmount', () => {
    document.body.style.overflow = 'auto'
    const { unmount } = renderHook(() =>
      useModalDismiss({ isOpen: true, onClose })
    )
    unmount()
    expect(document.body.style.overflow).toBe('auto')
  })

  test('does not call onClose for non-Escape keys', () => {
    renderHook(() => useModalDismiss({ isOpen: true, onClose }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(onClose).not.toHaveBeenCalled()
  })
})
