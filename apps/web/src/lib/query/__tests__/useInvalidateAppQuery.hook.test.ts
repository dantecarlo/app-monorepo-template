import { describe, expect, test, vi } from 'vitest'

import { QueryKeys } from '@/lib/query/queryKeys.constant'
import { useAppQuery } from '@/lib/query/useAppQuery.hook'
import { useInvalidateAppQuery } from '@/lib/query/useInvalidateAppQuery.hook'
import {
  createQueryWrapper,
  createTestQueryClient
} from '@/test/query.helper'
import { act, renderHook, waitFor } from '@/test/test.helper'

const LIST_KEY = QueryKeys.items.list({ limit: 1 })
const DETAIL_KEY = QueryKeys.items.detail('item-1')
// A key outside the items prefix, which an items invalidation leaves alone.
const OTHER_KEY = ['other']

describe('useInvalidateAppQuery', () => {
  test('marks every query under a key prefix stale and no other', async () => {
    const client = createTestQueryClient()
    client.setQueryData(LIST_KEY, [])
    client.setQueryData(DETAIL_KEY, {})
    client.setQueryData(OTHER_KEY, 0)
    const { result } = renderHook(() => useInvalidateAppQuery(), {
      wrapper: createQueryWrapper({ client })
    })

    await act(() => result.current({ queryKey: QueryKeys.items.all }))

    expect(client.getQueryState(LIST_KEY)?.isInvalidated).toBe(true)
    expect(client.getQueryState(DETAIL_KEY)?.isInvalidated).toBe(true)
    expect(client.getQueryState(OTHER_KEY)?.isInvalidated).toBe(false)
  })

  test('runs an observed query under the prefix again', async () => {
    const queryFn = vi
      .fn()
      .mockResolvedValueOnce(['first'])
      .mockResolvedValueOnce(['second'])
    const { result } = renderHook(
      () => ({
        invalidate: useInvalidateAppQuery(),
        list: useAppQuery<string[]>({
          queryOptions: { queryFn, queryKey: LIST_KEY }
        })
      }),
      { wrapper: createQueryWrapper() }
    )
    await waitFor(() =>
      expect(result.current.list.data).toEqual(['first'])
    )

    await act(() =>
      result.current.invalidate({ queryKey: QueryKeys.items.all })
    )

    await waitFor(() =>
      expect(result.current.list.data).toEqual(['second'])
    )
    expect(queryFn).toHaveBeenCalledTimes(2)
  })
})
