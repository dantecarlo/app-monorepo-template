import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UiState {
  sidebarCollapsed: boolean;
  activeNavItem: string;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveNavItem: (item: string) => void;
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectSidebarCollapsed = (s: UiState): boolean => s.sidebarCollapsed;
export const selectActiveNavItem = (s: UiState): string => s.activeNavItem;
export const selectToggleSidebar = (s: UiState) => s.toggleSidebar;
export const selectSetActiveNavItem = (s: UiState) => s.setActiveNavItem;

// ---------------------------------------------------------------------------
// Store — persists layout prefs to localStorage
// ---------------------------------------------------------------------------

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      activeNavItem: 'home',

      toggleSidebar() {
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }));
      },

      setSidebarCollapsed(collapsed) {
        set({ sidebarCollapsed: collapsed });
      },

      setActiveNavItem(item) {
        set({ activeNavItem: item });
      },
    }),
    {
      name: 'app-ui',
      // Only persist layout prefs — not ephemeral nav state
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
    },
  ),
);
