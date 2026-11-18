import {
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  test,
  vi
} from 'vitest'

// cacheLife and cacheTag run only inside a 'use cache' function of a Next
// render, so the test replaces them with spies.
const { cacheLife, cacheTag } = vi.hoisted(() => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn()
}))

vi.mock('next/cache', () => ({ cacheLife, cacheTag }))

import { applyCachePolicy, CacheLifeEnum } from '@/lib/cache'
import type { ICachePolicy } from '@/lib/cache/cachePolicy.type'

const ITEMS_TAG = 'items'
const SUMMARY_TAG = 'items-summary'

describe('applyCachePolicy', () => {
  beforeEach(() => {
    cacheLife.mockClear()
    cacheTag.mockClear()
  })

  test('sets every profile of the app under its own name', () => {
    const profiles = Object.values(CacheLifeEnum)

    profiles.forEach((life) => {
      applyCachePolicy({ life, tags: [SUMMARY_TAG] })
    })

    expect(cacheLife.mock.calls).toEqual(profiles.map((life) => [life]))
  })

  test('hands its life profile and every tag to the framework cache, once each', () => {
    applyCachePolicy({
      life: CacheLifeEnum.HOURS,
      tags: [ITEMS_TAG, SUMMARY_TAG]
    })

    expect(cacheLife).toHaveBeenCalledExactlyOnceWith('hours')
    expect(cacheTag).toHaveBeenCalledExactlyOnceWith(
      ITEMS_TAG,
      SUMMARY_TAG
    )
  })

  test("takes one of the seven life profiles Next ships, under the app's own type", () => {
    expect(Object.values(CacheLifeEnum).sort()).toEqual([
      'days',
      'default',
      'hours',
      'max',
      'minutes',
      'seconds',
      'weeks'
    ])
    expectTypeOf<ICachePolicy>().toEqualTypeOf<{
      life:
        | 'days'
        | 'default'
        | 'hours'
        | 'max'
        | 'minutes'
        | 'seconds'
        | 'weeks'
      tags: readonly string[]
    }>()
    expectTypeOf(applyCachePolicy)
      .parameter(0)
      .toEqualTypeOf<ICachePolicy>()
  })
})
