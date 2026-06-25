import { expect, test } from 'vitest'

import { imageDelivery } from '@/lib/image-delivery/imageDelivery.adapter'

test('imageDelivery adapter satisfies the IImageDeliveryPort contract', () => {
  expect(typeof imageDelivery.buildImageUrl).toBe('function')
  expect(typeof imageDelivery.buildSignedImageUrl).toBe('function')
})

test('buildImageUrl returns the raw public path by default', () => {
  expect(imageDelivery.buildImageUrl({ path: '/img.png' })).toBe(
    '/img.png'
  )
})
