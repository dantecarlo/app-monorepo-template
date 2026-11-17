import { QueryClient } from '@tanstack/react-query'
import { describe, expect, test } from 'vitest'

import {
  QueryKeys,
  QueryKeySegmentEnum
} from '@/lib/query/queryKeys.constant'

// A value a user could type, or the data could hold, for every factory.
const PROBE_VALUE = 'probe-value'
const PROBE_LIMIT = 7

type QueryKeysType = typeof QueryKeys

type KeyFactoryType = (probe: unknown) => readonly unknown[]

type FactoryNameType<Feature extends keyof QueryKeysType> = {
  [Entry in keyof QueryKeysType[Feature]]: QueryKeysType[Feature][Entry] extends (
    probe: never
  ) => unknown
    ? Entry
    : never
}[keyof QueryKeysType[Feature]]

// The argument each factory is probed with, typed by the factory itself: a
// factory added without one fails the typecheck, and the walk below fails
// at run time.
const FACTORY_PROBES: {
  [Feature in keyof QueryKeysType]: {
    [Entry in FactoryNameType<Feature>]: Parameters<
      Extract<QueryKeysType[Feature][Entry], (probe: never) => unknown>
    >[0]
  }
} = {
  items: {
    detail: PROBE_VALUE,
    list: { limit: PROBE_LIMIT, search: PROBE_VALUE }
  }
}

const REGISTERED: ReadonlySet<unknown> = new Set(
  Object.values(QueryKeySegmentEnum)
)

const probeOf = ({
  entryName,
  featureName
}: {
  entryName: string
  featureName: string
}): unknown =>
  (FACTORY_PROBES as Record<string, Record<string, unknown>>)[
    featureName
  ]?.[entryName]

// Every key QueryKeys builds: each fixed key, and each factory called with
// its probe argument; and every factory that has no probe.
const walkKeys = () => {
  const keys: (readonly unknown[])[] = []
  const unprobed: string[] = []
  Object.entries(QueryKeys).forEach(([featureName, feature]) => {
    Object.entries(feature).forEach(([entryName, entry]) => {
      if (typeof entry !== 'function') {
        keys.push(entry as readonly unknown[])
        return
      }
      const probe = probeOf({ entryName, featureName })
      if (probe === undefined) unprobed.push(`${featureName}.${entryName}`)
      keys.push((entry as KeyFactoryType)(probe))
    })
  })
  return { keys, unprobed }
}

describe('QueryKeys', () => {
  test('builds every string segment of every key factory from QueryKeySegmentEnum', () => {
    const { keys, unprobed } = walkKeys()
    const strings = keys.flatMap((key) =>
      key.filter((segment) => typeof segment === 'string')
    )

    expect(unprobed).toEqual([])
    expect(keys.length).toBeGreaterThan(0)
    expect(strings.filter((segment) => !REGISTERED.has(segment))).toEqual(
      []
    )
  })

  test('puts the list search and limit and the detail id in a trailing params object', () => {
    expect(QueryKeys.items.list({ limit: 10, search: 'alice' })).toEqual([
      'items',
      'list',
      { limit: 10, search: 'alice' }
    ])
    expect(
      QueryKeys.items.list({ limit: 20, search: 'alice' })
    ).not.toEqual(QueryKeys.items.list({ limit: 10, search: 'alice' }))
    expect(QueryKeys.items.detail('item_001')).toEqual([
      'items',
      'detail',
      { id: 'item_001' }
    ])
  })

  test('keeps the limit in the list key when no search is given', () => {
    expect(QueryKeys.items.list({ limit: 50 })).toEqual([
      'items',
      'list',
      { limit: 50, search: '' }
    ])
    expect(QueryKeys.items.list({ limit: 50, search: '' })).toEqual(
      QueryKeys.items.list({ limit: 50 })
    )
  })

  test('invalidates every items query through the items all key', async () => {
    const client = new QueryClient()
    const listKey = QueryKeys.items.list({ limit: 50, search: 'alice' })
    const detailKey = QueryKeys.items.detail('item_001')
    client.setQueryData(listKey, [])
    client.setQueryData(detailKey, null)

    await client.invalidateQueries({ queryKey: QueryKeys.items.all })

    expect(client.getQueryState(listKey)?.isInvalidated).toBe(true)
    expect(client.getQueryState(detailKey)?.isInvalidated).toBe(true)
  })
})
