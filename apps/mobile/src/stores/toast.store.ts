// Mirrors apps/web/src/stores/toast.store.ts — identical.
// Zustand is framework-agnostic; this file works unchanged in RN.

import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  add: (payload: Omit<Toast, 'id'>) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const selectToasts = (s: ToastState): Toast[] => s.toasts;
export const selectAddToast = (s: ToastState) => s.add;
export const selectRemoveToast = (s: ToastState) => s.remove;

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add(payload) {
    const id = String(nextId++);
    set((s) => ({ toasts: [...s.toasts, { ...payload, id }] }));
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      4_000,
    );
  },
  remove(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
  clear() {
    set({ toasts: [] });
  },
}));
