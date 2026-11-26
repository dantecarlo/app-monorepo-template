import { Animated } from 'react-native'
import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  ANIMATE_DURATION_MS,
  KNOB_ON_X
} from '@/components/ui/Toggle/Toggle.constant'
import { useToggleKnob } from '@/components/ui/Toggle/useToggleKnob.hook'
import { renderHook } from '@/test/test.helper'

const renderKnob = () =>
  renderHook(({ value }: { value: boolean }) => useToggleKnob(value), {
    initialProps: { value: false }
  })

describe('useToggleKnob', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('is exported as a function', () => {
    expect(typeof useToggleKnob).toBe('function')
  })

  test('keeps one animated value across renders', () => {
    const { rerender, result } = renderKnob()
    const first = result.current.translateX

    rerender({ value: true })

    expect(result.current.translateX).toBe(first)
  })

  test('animates the knob to the on offset when the value turns on', () => {
    const timing = vi.spyOn(Animated, 'timing')
    const { rerender, result } = renderKnob()

    rerender({ value: true })

    expect(timing).toHaveBeenLastCalledWith(result.current.translateX, {
      duration: ANIMATE_DURATION_MS,
      toValue: KNOB_ON_X,
      useNativeDriver: true
    })
  })
})
