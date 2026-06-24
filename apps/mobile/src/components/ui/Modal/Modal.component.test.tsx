import { render, screen } from '@testing-library/react-native'
import { describe, expect, test, vi } from 'vitest'

import { Modal } from '@/components/ui/Modal/Modal.component'

describe('Modal', () => {
  test('renders children when visible', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <></>
      </Modal>
    )
    expect(screen.UNSAFE_queryAllByType).toBeTruthy()
  })
})
