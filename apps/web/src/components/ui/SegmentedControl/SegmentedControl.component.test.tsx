import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'

import { SegmentedControl } from '@/components/ui/SegmentedControl/SegmentedControl.component'

const SEGMENTS = [
  { id: 'siempre', label: 'Siempre' },
  { id: 'por-turno', label: 'Por turno' }
] as const

describe('SegmentedControl', () => {
  test('renders all segments', () => {
    render(
      <SegmentedControl
        activeId="siempre"
        onSegmentPress={vi.fn()}
        segments={SEGMENTS}
      />
    )
    expect(screen.getByRole('tab', { name: 'Siempre' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Por turno' })).toBeTruthy()
  })

  test('marks active tab as selected', () => {
    render(
      <SegmentedControl
        activeId="siempre"
        onSegmentPress={vi.fn()}
        segments={SEGMENTS}
      />
    )
    const activeTab = screen.getByRole('tab', { name: 'Siempre' })
    expect(activeTab.getAttribute('aria-selected')).toBe('true')
  })

  test('calls onSegmentPress with the segment id', async () => {
    const onSegmentPress = vi.fn()
    render(
      <SegmentedControl
        activeId="siempre"
        onSegmentPress={onSegmentPress}
        segments={SEGMENTS}
      />
    )
    await userEvent.click(screen.getByRole('tab', { name: 'Por turno' }))
    expect(onSegmentPress).toHaveBeenCalledWith('por-turno')
  })

  test('is exported as a function', () => {
    expect(typeof SegmentedControl).toBe('function')
  })
})
