// Mobile-adapted ui.store — tracks the active bottom-nav tab and drawer state.

import { createAppStore } from '@/lib/store/createAppStore.helper'

export type NavTabType = 'home' | 'items' | 'search' | 'profile'

interface IUiState {
  activeTab: NavTabType
  closeDrawer: () => void
  drawerOpen: boolean
  openDrawer: () => void
  setActiveTab: (tab: NavTabType) => void
  toggleDrawer: () => void
}

export const selectActiveTab = (s: IUiState): NavTabType => s.activeTab
export const selectDrawerOpen = (s: IUiState): boolean => s.drawerOpen
export const selectSetActiveTab = (s: IUiState) => s.setActiveTab
export const selectToggleDrawer = (s: IUiState) => s.toggleDrawer

export const useUiStore = createAppStore<IUiState>({
  initializer: ({ set }) => ({
    activeTab: 'home',
    closeDrawer() {
      set({ drawerOpen: false })
    },
    drawerOpen: false,
    openDrawer() {
      set({ drawerOpen: true })
    },
    setActiveTab(tab) {
      set({ activeTab: tab })
    },
    toggleDrawer() {
      set((s) => ({ drawerOpen: !s.drawerOpen }))
    }
  })
})
