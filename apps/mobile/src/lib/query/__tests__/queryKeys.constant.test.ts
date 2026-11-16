import { QueryClient } from '@tanstack/react-query'
import { describe, expect, test } from 'vitest'

import {
  QueryKeys,
  QueryKeySegmentEnum
} from '@/lib/query/queryKeys.constant'

// A value a user could type, or the data could hold, for every factory.
const PROBE_VALUE = 'probe-value'

type KeyFactoryType = (value: string) => readonly unknown[]

const REGISTERED: ReadonlySet<unknown> = new Set(
  Object.values(QueryKeySegmentEnum)
)

// Every key QueryKeys builds: each fixed key, and each factory called with
// the probe value.
const everyKey = (): (readonly unknown[])[] =>
  Object.values(QueryKeys).flatMap((feature) =>
    Object.values(feature).map((entry) =>
      typeof entry === 'function'
        ? (entry as KeyFactoryType)(PROBE_VALUE)
        : (entry as readonly unknown[])
    )
  )

describe('QueryKeys', () => {
  test('builds every string segment of every key factory from QueryKeySegmentEnum', () => {
    const keys = everyKey()
    const strings = keys.flatMap((key) =>
      key.filter((segment) => typeof segment === 'string')
    )

    expect(keys.length).toBeGreaterThan(0)
    expect(strings.filter((segment) => !REGISTERED.has(segment))).toEqual(
      []
    )
  })

  test('puts the list filter and the detail id in a trailing params object', () => {
    expect(QueryKeys.items.list('alice')).toEqual([
      'items',
      'list',
      { filter: 'alice' }
    ])
    expect(QueryKeys.items.detail('item_001')).toEqual([
      'items',
      'detail',
      { id: 'item_001' }
    ])
  })

  test('keeps the bare list key when no filter is given', () => {
    expect(QueryKeys.items.list()).toEqual(['items', 'list'])
    expect(QueryKeys.items.list('')).toEqual(['items', 'list'])
  })

  test('invalidates every items query through the items all key', async () => {
    const client = new QueryClient()
    const listKey = QueryKeys.items.list('alice')
    const detailKey = QueryKeys.items.detail('item_001')
    client.setQueryData(listKey, [])
    client.setQueryData(detailKey, null)

    await client.invalidateQueries({ queryKey: QueryKeys.items.all })

    expect(client.getQueryState(listKey)?.isInvalidated).toBe(true)
    expect(client.getQueryState(detailKey)?.isInvalidated).toBe(true)
  })
})
