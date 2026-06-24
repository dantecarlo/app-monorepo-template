'use client'

import type { JSX } from 'react'

export const EmptyStateIcon = (): JSX.Element => (
  <svg
    aria-hidden="true"
    fill="none"
    height={28}
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
    width={28}
  >
    <path d="M22 12h-6l-2 3H10l-2-3H2" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
)
