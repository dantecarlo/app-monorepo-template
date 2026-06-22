import { create } from 'zustand'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToastVariantType = 'success' | 'error' | 'info' | 'warning'

export interface IToast {
  id: string
  message: string
  variant: ToastVariantType
}

interface IToastState {
  add: (payload: Omit<IToast, 'id'>) => void
  clear: () => void
  remove: (id: string) => void
  toasts: IToast[]
}

// ---------------------------------------------------------------------------
// Selectors — prefer named selectors over inline arrow functions
// to avoid unnecessary re-renders.
// ---------------------------------------------------------------------------

export const selectToasts = (s: IToastState): IToast[] => s.toasts
export const selectAddToast = (s: IToastState) => s.add
export const selectRemoveToast = (s: IToastState) => s.remove

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

let nextId = 1
const AUTO_DISMISS_MS = 4_000

export const useToastStore = create<IToastState>((set) => ({
  add(payload) {
    const id = String(nextId++)
    const toast: IToast = { ...payload, id }
    set((s) => ({ toasts: [...s.toasts, toast] }))

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, AUTO_DISMISS_MS)
  },

  clear() {
    set({ toasts: [] })
  },

  remove(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },

  toasts: []
}))
