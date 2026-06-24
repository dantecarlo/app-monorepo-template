'use client'

import type { JSX } from 'react'

import {
  TOAST_DISMISS_BTN,
  TOAST_DOT_BASE,
  TOAST_DOT_CLASS,
  TOAST_MESSAGE,
  TOAST_VIEWPORT,
  toastPillVariants
} from '@/components/ui/Toast/Toast.styles'
import {
  selectRemoveToast,
  selectToasts,
  useToastStore
} from '@/stores/toast.store'

const DISMISS_LABEL = 'Dismiss'

export const Toast = (): JSX.Element => {
  const toasts = useToastStore(selectToasts)
  const remove = useToastStore(selectRemoveToast)

  return (
    <div aria-live="polite" className={TOAST_VIEWPORT} role="status">
      {toasts.map((toast) => (
        <div className={toastPillVariants()} key={toast.id}>
          <span
            aria-hidden="true"
            className={`${TOAST_DOT_BASE} ${TOAST_DOT_CLASS[toast.variant]}`}
          />
          <p className={TOAST_MESSAGE}>{toast.message}</p>
          <button
            aria-label={DISMISS_LABEL}
            className={TOAST_DISMISS_BTN}
            onClick={() => remove(toast.id)}
            type="button"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
