import { beforeEach, describe, expect, test } from 'vitest'

import {
  selectActiveNavItem,
  selectSetActiveNavItem,
  selectSidebarCollapsed,
  selectToggleSidebar,
  useUiStore
} from './ui.store'

beforeEach(() => {
  useUiStore.setState({ activeNavItem: 'home', sidebarCollapsed: false })
})

describe('ui.store', () => {
  test('starts with sidebar open and home nav item', () => {
    expect(selectSidebarCollapsed(useUiStore.getState())).toBe(false)
    expect(selectActiveNavItem(useUiStore.getState())).toBe('home')
  })

  test('toggleSidebar flips the collapsed flag', () => {
    selectToggleSidebar(useUiStore.getState())()
    expect(selectSidebarCollapsed(useUiStore.getState())).toBe(true)
    selectToggleSidebar(useUiStore.getState())()
    expect(selectSidebarCollapsed(useUiStore.getState())).toBe(false)
  })

  test('setSidebarCollapsed sets an explicit value', () => {
    useUiStore.getState().setSidebarCollapsed(true)
    expect(selectSidebarCollapsed(useUiStore.getState())).toBe(true)
  })

  test('setActiveNavItem updates the active nav item', () => {
    selectSetActiveNavItem(useUiStore.getState())('settings')
    expect(selectActiveNavItem(useUiStore.getState())).toBe('settings')
  })
})
