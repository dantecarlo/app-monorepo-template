import { http, HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'

import { ITEMS_API_URL } from '@/services/items.constant'
import { fetchItems } from '@/services/items.service'
import { MOCK_ITEM_DTOS } from '@/test/mocks/items.mock'
import { server } from '@/test/mocks/server'

// ---------------------------------------------------------------------------
// HTTP service — exercised against MSW (no vi.mock of fetch).
// ---------------------------------------------------------------------------

describe('fetchItems', () => {
  test('returns the items returned by the endpoint', async () => {
    const items = await fetchItems({})
    expect(items).toHaveLength(MOCK_ITEM_DTOS.length)
    expect(items[0]?.id).toBe('item_001')
  })

  test('forwards the search query to the endpoint', async () => {
    const items = await fetchItems({ search: 'onboarding' })
    expect(items).toHaveLength(1)
    expect(items[0]?.title).toMatch(/onboarding/i)
  })

  test('throws when the endpoint responds with a non-OK status', async () => {
    server.use(
      http.get(ITEMS_API_URL, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 })
      )
    )

    await expect(fetchItems({})).rejects.toThrow(/500/)
  })
})
