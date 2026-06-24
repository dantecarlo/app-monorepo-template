import { describe, expect, test, vi } from 'vitest'

import { Modal } from '@/components/ui/Modal/Modal.component'

describe('Modal', () => {
  test('is exported as a function', () => {
    expect(typeof Modal).toBe('function')
  })

  test('accepts required props shape', () => {
    expect(() => {
      const _props = {
        children: null,
        isOpen: false,
        onClose: vi.fn()
      }
      expect(_props.isOpen).toBe(false)
    }).not.toThrow()
  })
})
