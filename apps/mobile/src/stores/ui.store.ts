// Mobile-adapted ui.store — tracks the active bottom-nav tab and drawer state.
// Zustand is framework-agnostic; this works unchanged in React Native.

import { create } from 'zustand';

export type NavTab = 'home' | 'items' | 'search' | 'profile';

interface UiState {
  activeTab: NavTab;
  drawerOpen: boolean;
  setActiveTab: (tab: NavTab) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

export const selectActiveTab = (s: UiState): NavTab => s.activeTab;
export const selectDrawerOpen = (s: UiState): boolean => s.drawerOpen;
export const selectSetActiveTab = (s: UiState) => s.setActiveTab;
export const selectToggleDrawer = (s: UiState) => s.toggleDrawer;

export const useUiStore = create<UiState>((set) => ({
  activeTab: 'home',
  drawerOpen: false,
  setActiveTab(tab) {
    set({ activeTab: tab });
  },
  openDrawer() {
    set({ drawerOpen: true });
  },
  closeDrawer() {
    set({ drawerOpen: false });
  },
  toggleDrawer() {
    set((s) => ({ drawerOpen: !s.drawerOpen }));
  },
}));
