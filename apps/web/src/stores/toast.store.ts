import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Selectors — prefer named selectors over inline arrow functions
// to avoid unnecessary re-renders.
// ---------------------------------------------------------------------------

export const selectToasts = (s: ToastState): Toast[] => s.toasts;
export const selectAddToast = (s: ToastState) => s.add;
export const selectRemoveToast = (s: ToastState) => s.remove;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

let nextId = 1;
const AUTO_DISMISS_MS = 4_000;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  add(payload) {
    const id = String(nextId++);
    const toast: Toast = { ...payload, id };
    set((s) => ({ toasts: [...s.toasts, toast] }));

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, AUTO_DISMISS_MS);
  },

  remove(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  clear() {
    set({ toasts: [] });
  },
}));
