import { beforeEach, describe, expect, test } from 'vitest'

import {
  selectActiveTab,
  selectDrawerOpen,
  selectSetActiveTab,
  selectToggleDrawer,
  useUiStore
} from './ui.store'

beforeEach(() => {
  useUiStore.setState({ activeTab: 'home', drawerOpen: false })
})

describe('ui.store', () => {
  test('starts with home tab and closed drawer', () => {
    expect(selectActiveTab(useUiStore.getState())).toBe('home')
    expect(selectDrawerOpen(useUiStore.getState())).toBe(false)
  })

  test('setActiveTab changes the active tab', () => {
    selectSetActiveTab(useUiStore.getState())('items')
    expect(selectActiveTab(useUiStore.getState())).toBe('items')
  })

  test('openDrawer sets drawerOpen to true', () => {
    useUiStore.getState().openDrawer()
    expect(selectDrawerOpen(useUiStore.getState())).toBe(true)
  })

  test('closeDrawer sets drawerOpen to false', () => {
    useUiStore.getState().openDrawer()
    useUiStore.getState().closeDrawer()
    expect(selectDrawerOpen(useUiStore.getState())).toBe(false)
  })

  test('toggleDrawer flips the drawer state', () => {
    selectToggleDrawer(useUiStore.getState())()
    expect(selectDrawerOpen(useUiStore.getState())).toBe(true)
    selectToggleDrawer(useUiStore.getState())()
    expect(selectDrawerOpen(useUiStore.getState())).toBe(false)
  })
})
