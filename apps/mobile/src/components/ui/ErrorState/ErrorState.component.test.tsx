import { render } from '@testing-library/react-native'
import { describe, expect, test, vi } from 'vitest'

import { ErrorState } from '@/components/ui/ErrorState/ErrorState.component'

describe('ErrorState', () => {
  test('renders without crashing', () => {
    const { toJSON } = render(<ErrorState />)
    expect(toJSON).toBeTruthy()
  })

  test('renders with a retry handler', () => {
    const { toJSON } = render(<ErrorState onRetry={vi.fn()} />)
    expect(toJSON).toBeTruthy()
  })
})
