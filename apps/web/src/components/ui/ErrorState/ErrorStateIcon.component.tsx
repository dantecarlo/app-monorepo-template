'use client'

import type { JSX } from 'react'

export const ErrorStateIcon = (): JSX.Element => (
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
    <path d="m10.29 3.86-8.2 14.2A2 2 0 0 0 3.77 21h16.46a2 2 0 0 0 1.68-3.09l-8.2-14.2a2 2 0 0 0-3.42 0z" />
    <line x1="12" x2="12" y1="9" y2="13" />
    <line x1="12" x2="12.01" y1="17" y2="17" />
  </svg>
)
