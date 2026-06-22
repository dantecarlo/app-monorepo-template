import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IUiState {
  activeNavItem: string
  setActiveNavItem: (item: string) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectSidebarCollapsed = (s: IUiState): boolean =>
  s.sidebarCollapsed
export const selectActiveNavItem = (s: IUiState): string => s.activeNavItem
export const selectToggleSidebar = (s: IUiState) => s.toggleSidebar
export const selectSetActiveNavItem = (s: IUiState) => s.setActiveNavItem

// ---------------------------------------------------------------------------
// Store — persists layout prefs to localStorage
// ---------------------------------------------------------------------------

export const useUiStore = create<IUiState>()(
  persist(
    (set) => ({
      activeNavItem: 'home',
      setActiveNavItem(item) {
        set({ activeNavItem: item })
      },

      setSidebarCollapsed(collapsed) {
        set({ sidebarCollapsed: collapsed })
      },

      sidebarCollapsed: false,

      toggleSidebar() {
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }))
      }
    }),
    {
      name: 'app-ui',
      // Only persist layout prefs — not ephemeral nav state
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed })
    }
  )
)
