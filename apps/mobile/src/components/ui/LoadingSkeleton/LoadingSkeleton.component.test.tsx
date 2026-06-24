import { render } from '@testing-library/react-native'
import { describe, expect, test } from 'vitest'

import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton/LoadingSkeleton.component'

describe('LoadingSkeleton', () => {
  test('renders without crashing', () => {
    const { toJSON } = render(<LoadingSkeleton />)
    expect(toJSON).toBeTruthy()
  })
})
