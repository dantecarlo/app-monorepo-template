import { render } from '@testing-library/react-native'
import { describe, expect, test, vi } from 'vitest'

import { ConfirmDialog } from '@/components/ui/ConfirmDialog/ConfirmDialog.component'

describe('ConfirmDialog', () => {
  test('renders without crashing', () => {
    const { toJSON } = render(
      <ConfirmDialog
        isOpen={false}
        message="Are you sure?"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    expect(toJSON).toBeTruthy()
  })
})
