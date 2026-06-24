import { renderHook } from '@testing-library/react-native'
import { describe, expect, test } from 'vitest'

import { useShimmer } from '@/components/ui/LoadingSkeleton/useShimmer.hook'

describe('useShimmer', () => {
  test('returns an animatedStyle object', () => {
    const { result } = renderHook(() => useShimmer())
    expect(result.current.animatedStyle).toBeTruthy()
  })
})
