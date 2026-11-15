import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { SegmentedControl } from '@/components/ui/SegmentedControl/SegmentedControl.component'

const SEGMENTS = [
  { id: 'always', label: 'Always' },
  { id: 'per-shift', label: 'Per shift' }
] as const

describe('SegmentedControl', () => {
  test('renders all segments', () => {
    render(
      <SegmentedControl
        activeId="always"
        onSegmentPress={vi.fn()}
        segments={SEGMENTS}
      />
    )
    expect(screen.getByRole('tab', { name: 'Always' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Per shift' })).toBeTruthy()
  })

  test('marks active tab as selected', () => {
    render(
      <SegmentedControl
        activeId="always"
        onSegmentPress={vi.fn()}
        segments={SEGMENTS}
      />
    )
    const activeTab = screen.getByRole('tab', { name: 'Always' })
    expect(activeTab.getAttribute('aria-selected')).toBe('true')
  })

  test('calls onSegmentPress with the segment id', () => {
    const onSegmentPress = vi.fn()
    render(
      <SegmentedControl
        activeId="always"
        onSegmentPress={onSegmentPress}
        segments={SEGMENTS}
      />
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Per shift' }))
    expect(onSegmentPress).toHaveBeenCalledWith('per-shift')
  })

  test('is exported as a function', () => {
    expect(typeof SegmentedControl).toBe('function')
  })
})
