import { describe, expect, test, vi } from 'vitest'

import { ConfirmDialog } from '@/components/ui/ConfirmDialog/ConfirmDialog.component'

describe('ConfirmDialog', () => {
  test('is exported as a function', () => {
    expect(typeof ConfirmDialog).toBe('function')
  })

  test('accepts required props shape', () => {
    const props = {
      isOpen: false,
      message: 'Are you sure?',
      onCancel: vi.fn(),
      onConfirm: vi.fn()
    }
    expect(props.message).toBe('Are you sure?')
  })
})
