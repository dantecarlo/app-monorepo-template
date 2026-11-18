import { expect, test } from 'vitest'

import { createMemoryKeyValueStorage } from '#src/index'

const KEY = 'theme'

test('reads back what it was handed, and null for a key it never held', async () => {
  const storage = createMemoryKeyValueStorage()

  await storage.setItem({ key: KEY, value: 'dark' })

  expect(await storage.getItem({ key: KEY })).toBe('dark')
  expect(await storage.getItem({ key: 'language' })).toBeNull()
})

test('removes a key', async () => {
  const storage = createMemoryKeyValueStorage()
  await storage.setItem({ key: KEY, value: 'dark' })

  await storage.removeItem({ key: KEY })

  expect(await storage.getItem({ key: KEY })).toBeNull()
})

test('keeps the values of each storage apart', async () => {
  const first = createMemoryKeyValueStorage()
  const second = createMemoryKeyValueStorage()

  await first.setItem({ key: KEY, value: 'dark' })

  expect(await second.getItem({ key: KEY })).toBeNull()
})
