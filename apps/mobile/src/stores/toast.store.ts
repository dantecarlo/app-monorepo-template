// Mirrors apps/web/src/stores/toast.store.ts — identical.
// Zustand is framework-agnostic; this file works unchanged in RN.

import { create } from 'zustand'

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

export const selectToasts = (s: IToastState): IToast[] => s.toasts
export const selectAddToast = (s: IToastState) => s.add
export const selectRemoveToast = (s: IToastState) => s.remove

let nextId = 1
const AUTO_DISMISS_MS = 4_000

export const useToastStore = create<IToastState>((set) => ({
  add(payload) {
    const id = String(nextId++)
    set((s) => ({ toasts: [...s.toasts, { ...payload, id }] }))
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      AUTO_DISMISS_MS
    )
  },
  clear() {
    set({ toasts: [] })
  },
  remove(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
  toasts: []
}))
