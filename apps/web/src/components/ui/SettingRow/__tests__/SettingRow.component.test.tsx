import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { SettingRow } from '@/components/ui/SettingRow/SettingRow.component'

describe('SettingRow', () => {
  test('renders the label', () => {
    render(<SettingRow label="Notifications" />)
    expect(screen.getByText('Notifications')).toBeTruthy()
  })

  test('renders subtitle when provided', () => {
    render(<SettingRow label="Notifications" subtitle="Push alerts" />)
    expect(screen.getByText('Push alerts')).toBeTruthy()
  })

  test('renders value text when provided and no control', () => {
    render(<SettingRow label="Language" value="English" />)
    expect(screen.getByText('English')).toBeTruthy()
  })

  test('renders as button when onClick is provided', () => {
    render(<SettingRow label="Account" onClick={vi.fn()} />)
    expect(screen.getByRole('button')).toBeTruthy()
  })

  test('is exported as a function', () => {
    expect(typeof SettingRow).toBe('function')
  })
})
