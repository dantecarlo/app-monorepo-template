'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

const STALE_TIME_MS = 30_000 // 30 seconds

const makeQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      mutations: {
        retry: 0
      },
      queries: {
        refetchOnWindowFocus: true,
        retry: 1,
        staleTime: STALE_TIME_MS
      }
    }
  })

// Singleton for the browser; always fresh on the server.
let browserQueryClient: QueryClient | undefined

const getQueryClient = (): QueryClient => {
  if (typeof window === 'undefined') {
    // Server: create a new client per request
    return makeQueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}

interface IProvidersProps {
  children: React.ReactNode
}

export const Providers = ({ children }: IProvidersProps) => {
  // useState prevents client recreation on re-renders
  const [queryClient] = useState(() => getQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
