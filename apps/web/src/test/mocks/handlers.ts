import { http, HttpResponse } from 'msw'

import { ITEMS_API_URL } from '@/services/items.constant'
import { MOCK_ITEM_DTOS } from '@/test/mocks/items.mock'

// Default happy-path handlers. Override per-test with server.use(...) to
// simulate errors or alternate payloads.
export const handlers = [
  http.get(ITEMS_API_URL, ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase()

    const items = search
      ? MOCK_ITEM_DTOS.filter(
          (item) =>
            item.title.toLowerCase().includes(search) ||
            item.description.toLowerCase().includes(search) ||
            item.category.toLowerCase().includes(search)
        )
      : MOCK_ITEM_DTOS

    return HttpResponse.json(items)
  })
]
