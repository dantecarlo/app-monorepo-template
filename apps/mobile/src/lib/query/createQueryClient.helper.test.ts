import { describe, expect, test, vi } from 'vitest'

import { createQueryClient } from '@/lib/query/createQueryClient.helper'

describe('createQueryClient', () => {
  test('returns a QueryClient instance', () => {
    const client = createQueryClient()
    expect(client).toBeDefined()
    expect(typeof client.fetchQuery).toBe('function')
  })

  test('applies 30s stale time by default', () => {
    const client = createQueryClient()
    const EXPECTED_STALE_MS = 30_000
    expect(client.getDefaultOptions().queries?.staleTime).toBe(
      EXPECTED_STALE_MS
    )
  })

  test('applies retry: 1 for queries', () => {
    const client = createQueryClient()
    expect(client.getDefaultOptions().queries?.retry).toBe(1)
  })

  test('applies retry: 0 for mutations', () => {
    const client = createQueryClient()
    expect(client.getDefaultOptions().mutations?.retry).toBe(0)
  })

  test('calls onCaptureError with sanitized queryKey on query failure', async () => {
    const spy = vi.fn()
    const client = createQueryClient({ onCaptureError: spy })
    const error = new Error('query boom')

    await client
      .fetchQuery({
        queryFn: async () => {
          throw error
        },
        queryKey: ['items', 'tenant-9f3c-uuid', 'list'],
        retry: false
      })
      .catch(() => undefined)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        queryKey: ['items', '[redacted]', 'list'],
        source: 'queryCache'
      })
    )
  })

  test('calls onCaptureError with mutationCache source on mutation failure', async () => {
    const spy = vi.fn()
    const client = createQueryClient({ onCaptureError: spy })
    const error = new Error('mutation boom')

    await client
      .getMutationCache()
      .build(client, {
        mutationFn: async () => {
          throw error
        },
        retry: false
      })
      .execute(undefined)
      .catch(() => undefined)

    expect(spy).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ source: 'mutationCache' })
    )
  })

  test('works without an onCaptureError param (default no-op)', async () => {
    const client = createQueryClient()

    await expect(
      client.fetchQuery({
        queryFn: async () => {
          throw new Error('no-op sink')
        },
        queryKey: ['items'],
        retry: false
      })
    ).rejects.toThrow('no-op sink')
  })
})
