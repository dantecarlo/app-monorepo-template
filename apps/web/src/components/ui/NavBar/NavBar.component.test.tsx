import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { Icon } from '@/components/ui/Icon/Icon.component'
import { NavBar } from '@/components/ui/NavBar/NavBar.component'

const ITEMS = [
  { icon: <Icon name="home" />, id: 'home', label: 'Home' },
  { icon: <Icon name="settings" />, id: 'settings', label: 'Settings' }
] as const

describe('NavBar', () => {
  test('renders all item labels', () => {
    render(
      <NavBar
        activeId="home"
        ariaLabel="Main navigation"
        items={ITEMS}
        onItemPress={vi.fn()}
      />
    )
    expect(screen.getByText('Home')).toBeTruthy()
    expect(screen.getByText('Settings')).toBeTruthy()
  })

  test('marks the active tab with aria-selected', () => {
    render(
      <NavBar
        activeId="settings"
        ariaLabel="Main navigation"
        items={ITEMS}
        onItemPress={vi.fn()}
      />
    )
    const tabs = screen.getAllByRole('tab')
    const settingsTab = tabs.find(
      (t) => t.getAttribute('aria-selected') === 'true'
    )
    expect(settingsTab).toBeTruthy()
  })

  test('is exported as a function', () => {
    expect(typeof NavBar).toBe('function')
  })
})
