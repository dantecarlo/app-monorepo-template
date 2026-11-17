import { describe, expect, test, vi } from 'vitest'

import { createQueryClient } from '@/lib/query/createQueryClient.helper'
import {
  QueryKeys,
  QueryKeySegmentEnum
} from '@/lib/query/queryKeys.constant'

// The limit every items list key below is built with.
const LIST_LIMIT = 50

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
        queryKey: ['items', 'account-9f3c-uuid', 'list'],
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

  test('redacts the search text of an items list key on query failure', async () => {
    const spy = vi.fn()
    const client = createQueryClient({ onCaptureError: spy })
    const error = new Error('search boom')

    await client
      .fetchQuery({
        queryFn: async () => {
          throw error
        },
        queryKey: QueryKeys.items.list({
          limit: LIST_LIMIT,
          search: 'alice'
        }),
        retry: false
      })
      .catch(() => undefined)

    expect(spy).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        queryKey: ['items', 'list', '[redacted]'],
        source: 'queryCache'
      })
    )
  })

  test('redacts a list search that equals a registered segment on query failure', async () => {
    const spy = vi.fn()
    const client = createQueryClient({ onCaptureError: spy })
    const error = new Error('typed word boom')

    await client
      .fetchQuery({
        queryFn: async () => {
          throw error
        },
        queryKey: QueryKeys.items.list({
          limit: LIST_LIMIT,
          search: QueryKeySegmentEnum.LIST
        }),
        retry: false
      })
      .catch(() => undefined)

    expect(spy).toHaveBeenCalledOnce()
    expect(spy).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        queryKey: ['items', 'list', '[redacted]'],
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

  test.each([
    {
      factory: 'detail',
      queryKey: QueryKeys.items.detail('list'),
      value: 'list'
    },
    {
      factory: 'detail',
      queryKey: QueryKeys.items.detail('items'),
      value: 'items'
    },
    {
      factory: 'list',
      queryKey: QueryKeys.items.list({
        limit: LIST_LIMIT,
        search: 'detail'
      }),
      value: 'detail'
    },
    {
      factory: 'detail',
      queryKey: QueryKeys.items.detail('a@b.co'),
      value: 'a@b.co'
    }
  ])(
    'redacts the value of $factory($value) on query failure, whatever it spells',
    async ({ queryKey }) => {
      const spy = vi.fn()
      const client = createQueryClient({ onCaptureError: spy })

      await client
        .fetchQuery({
          queryFn: async () => {
            throw new Error('typed value boom')
          },
          queryKey,
          retry: false
        })
        .catch(() => undefined)

      expect(spy).toHaveBeenCalledOnce()
      expect(spy).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          queryKey: [queryKey[0], queryKey[1], '[redacted]'],
          source: 'queryCache'
        })
      )
    }
  )
})
