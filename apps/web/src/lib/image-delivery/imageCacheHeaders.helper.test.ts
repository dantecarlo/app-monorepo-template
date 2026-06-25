import { expect, test } from 'vitest'

import { buildImageCacheHeaders } from '@/lib/image-delivery/imageCacheHeaders.helper'

test('buildImageCacheHeaders returns a long immutable Cache-Control header', () => {
  const headers = buildImageCacheHeaders()
  const header = headers[0]
  expect(header).toBeDefined()
  expect(header?.key).toBe('Cache-Control')
  expect(header?.value).toContain('immutable')
  expect(header?.value).toContain('max-age=31536000')
})
