import { expect, test } from 'vitest'

import { createPublicImageDelivery } from './createPublicImageDelivery.helper'

const EXPIRES_IN_SECONDS = 300

test('buildImageUrl returns the raw path when no baseUrl is configured', () => {
  const delivery = createPublicImageDelivery()
  expect(delivery.buildImageUrl({ path: '/img.png' })).toBe('/img.png')
})

test('buildImageUrl joins baseUrl and path without duplicate slashes', () => {
  const delivery = createPublicImageDelivery({
    baseUrl: 'https://cdn.test/'
  })
  expect(delivery.buildImageUrl({ path: '/img.png' })).toBe(
    'https://cdn.test/img.png'
  )
})

test('buildSignedImageUrl returns the public url unsigned', async () => {
  const delivery = createPublicImageDelivery({
    baseUrl: 'https://cdn.test'
  })
  const url = await delivery.buildSignedImageUrl({
    expiresInSeconds: EXPIRES_IN_SECONDS,
    path: 'img.png'
  })
  expect(url).toBe('https://cdn.test/img.png')
})
