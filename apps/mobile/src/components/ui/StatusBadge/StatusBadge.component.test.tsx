import { render, screen } from '@testing-library/react-native'
import { describe, expect, test } from 'vitest'

import { StatusBadge } from '@/components/ui/StatusBadge/StatusBadge.component'

describe('StatusBadge', () => {
  test('renders the label text', () => {
    render(<StatusBadge label="Active" tone="success" />)
    expect(screen.getByText('Active')).toBeTruthy()
  })

  test('renders without crashing with default tone', () => {
    const { toJSON } = render(<StatusBadge label="Neutral" />)
    expect(toJSON).toBeTruthy()
  })
})
