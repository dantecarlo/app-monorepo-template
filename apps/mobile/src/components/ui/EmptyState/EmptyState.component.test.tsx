import { render } from '@testing-library/react-native'
import { describe, expect, test } from 'vitest'

import { EmptyState } from '@/components/ui/EmptyState/EmptyState.component'

describe('EmptyState', () => {
  test('renders without crashing', () => {
    const { toJSON } = render(<EmptyState />)
    expect(toJSON).toBeTruthy()
  })
})
