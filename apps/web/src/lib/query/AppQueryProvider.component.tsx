'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import type { JSX } from 'react'

import type { IAppQueryProviderProps } from '@/lib/query/AppQueryProvider.type'

/**
 * The query client of every block below it: the one place a tree meets the
 * query library's provider.
 */
export const AppQueryProvider = ({
  children,
  client
}: IAppQueryProviderProps): JSX.Element => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
)
